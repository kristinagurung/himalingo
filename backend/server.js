const path = require("node:path");
require("dotenv").config();
const express  = require("express");
const cors     = require("cors");
const mongoose = require("mongoose");
const multer   = require("multer");
const fetch    = require("node-fetch");
const { spawn } = require("child_process");

const app  = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(express.json());
const upload = multer({ storage: multer.memoryStorage() });

/* ── DATABASE ─────────────────────────────────────────────────────────────── */

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB error:", err.message));

const HistorySchema = new mongoose.Schema({
  chatId:         { type: String, unique: true, required: true },
  userEmail:      { type: String, required: true },
  originalText:   String,
  translatedText: String,
  mode:           String,
  pinned:         { type: Boolean, default: false },
  updatedAt:      { type: Date, default: Date.now },
});

const UserSchema = new mongoose.Schema({
  email:    { type: String, unique: true, required: true },
  password: { type: String, required: true },
});

const History = mongoose.models.History || mongoose.model("History", HistorySchema);
const User    = mongoose.models.User    || mongoose.model("User", UserSchema);

/* ── RAG HELPER ───────────────────────────────────────────────────────────── */

function getRagContext(query, language) {
  return new Promise((resolve) => {
    const scriptPath = path.join(__dirname, "search_pinecone.py");
    const proc = spawn("python3", [scriptPath, query, language]);

    let stdout = "";
    let stderr = "";

    // 10 seconds — enough time for Pinecone + embedding
    const timer = setTimeout(() => {
      proc.kill();
      console.warn("[RAG] Timeout after 10s");
      resolve(null);
    }, 10000);

    proc.stdout.on("data", (d) => { stdout += d.toString(); });
    proc.stderr.on("data", (d) => { stderr += d.toString(); });

    proc.on("close", (code) => {
      clearTimeout(timer);
      if (stderr) console.warn("[RAG stderr]", stderr.trim());

      const result = stdout.trim();
      if (!result || result === "NO_MATCH" || result.startsWith("ERROR") || code !== 0) {
        console.log(`[RAG] No context for "${language}"`);
        resolve(null);
      } else {
        console.log(`[RAG] Context found for "${language}"`);
        resolve(result);
      }
    });

    proc.on("error", (err) => {
      clearTimeout(timer);
      console.error("[RAG] Spawn error:", err.message);
      resolve(null);
    });
  });
}

/* ── AI HELPER ────────────────────────────────────────────────────────────── */

async function askAI(messages, temperature = 0.05) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    console.error("[AI] OPENROUTER_API_KEY is missing from .env");
    return "__API_KEY_MISSING__";
  }

 const models = [
  "google/gemini-2.0-flash-lite-001",
  "google/gemini-2.0-flash-001",
  "meta-llama/llama-3.3-70b-instruct:free",
  "mistralai/mistral-small-3.1-24b-instruct:free",
];

  for (const modelId of models) {
    try {
      const controller = new AbortController();
      const timeoutId  = setTimeout(() => controller.abort(), 15000);

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization:  `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer":  "http://localhost:3000",
          "X-Title":       "Himalingo",
        },
        signal: controller.signal,
        body: JSON.stringify({
          model:       modelId,
          messages,
          temperature: temperature,
          top_p:       1,
        }),
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errText = await response.text();
        console.error(`[AI] ${modelId} HTTP ${response.status}:`, errText);
        await new Promise(r => setTimeout(r, 500));
        continue;
      }

      const data = await response.json();

      if (data.choices?.[0]?.message?.content) {
        console.log(`[AI] Success with ${modelId}`);
        return data.choices[0].message.content.trim();
      }

      if (data.error) {
        console.error(`[AI] ${modelId} error:`, data.error.message);
        await new Promise(r => setTimeout(r, 500));
      }

    } catch (e) {
      if (e.name === "AbortError") {
        console.error(`[AI] ${modelId} timed out after 15s`);
      } else {
        console.error(`[AI] ${modelId} failed:`, e.message);
      }
      await new Promise(r => setTimeout(r, 500));
    }
  }

  return "__AI_SERVICE_UNAVAILABLE__";
}

/* ── ROUTES ───────────────────────────────────────────────────────────────── */

app.post("/api/signup", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (await User.findOne({ email }))
      return res.status(400).json({ success: false, message: "User exists" });
    await new User({ email, password }).save();
    res.json({ success: true, token: "login-token" });
  } catch { res.status(500).json({ success: false }); }
});

app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email, password });
    if (!user)
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    res.json({ success: true, token: "login-token" });
  } catch { res.status(500).json({ success: false }); }
});

/* ── TRANSLATION ─────────────────────────────────────────────────────────── */

const SUPPORTED_LANGUAGES = ["Bhutia", "Lepcha", "Limbu", "Magar", "Rai", "Nepali"];

app.post("/translate", upload.single("image"), async (req, res) => {
  try {
    const { text, targetLanguage, mode } = req.body;

    // If frontend accidentally sends chat mode here, ignore
    if (mode === "chat") {
      return res.json({ success: true, translated: "" });
    }

    if (!text || !targetLanguage) {
      return res.status(400).json({ success: false, error: "Missing text or targetLanguage" });
    }

    const lang = targetLanguage.trim();
    console.log(`\n[Translate] "${text}" → ${lang}`);

    // 1. Get RAG context from Pinecone
    let context = null;
    if (SUPPORTED_LANGUAGES.includes(lang)) {
      context = await getRagContext(text, lang);
    }

    // 2. Build system prompt — FIX: const systemPrompt was missing before
    const systemPrompt = `You are a strict ${lang} translator. You only translate into ${lang}.
NEVER translate into Sherpa, Nepali, Hindi, Tibetan, or any other language.
You are translating into ${lang} and ONLY ${lang}.

ABSOLUTE RULES — no exceptions:
- Output ONE LINE only. Nothing else.
- Output ONLY the ${lang} transliteration in Roman script
- Do NOT output bullet points, numbered lists, or multiple options
- Do NOT output formal/informal variations
- Do NOT output explanations, grammar notes, or alternatives
- Do NOT output native script (no Tibetan, Devanagari, etc.)
- Do NOT output the English word or phrase
- Do NOT add quotes, brackets, or extra punctuation
- ONE LINE. ONE TRANSLATION. NOTHING ELSE.

${context
  ? `Use this verified ${lang} data and pick the single best match:\n${context}`
  : `Translate into ${lang} Roman script.`
}

Example of correct output for "Hello" in Bhutia:
Kuzu Zangpo

Example of correct output for "How are you?" in Bhutia:
Kuzu de le ga?

Now translate the user input. ONE LINE ONLY.`;

    // 3. Build messages
    let userContent = text;
    if (req.file) {
      userContent = [
        { type: "text", text },
        { type: "image_url", image_url: { url: `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}` } },
      ];
    }

    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user",   content: userContent  },
    ];

    // 4. Call AI
    const aiResult = await askAI(messages, 0.05);

    if (aiResult.includes("__AI_")) {
      return res.json({ success: true, translated: "Service busy. Please try again in a moment." });
    }

    // 5. Post-process — keep only first line, strip bullets/quotes
    const firstLine = aiResult
      .split("\n")
      .map(l => l.trim())
      .filter(l => l.length > 0)[0] || aiResult;

    const cleaned = firstLine
      .replace(/^[\d\-\*\•\.\)]+\s*/, "")
      .replace(/["'""''`]/g, "")
      .trim();

    console.log(`[Translate] Result: "${cleaned}"`);
    res.json({ success: true, translated: cleaned });

  } catch (err) {
    console.error("[Translate] Error:", err.message);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

/* ── CHAT ────────────────────────────────────────────────────────────────── */

app.post("/chat", upload.single("image"), async (req, res) => {
  try {
    const { text, history } = req.body;
    const parsedHistory = typeof history === "string" ? JSON.parse(history) : (history || []);

    const messages = [
      { role: "system", content: "You are Himalingo, a helpful assistant specialising in Himalayan languages and culture." },
    ];

    parsedHistory.forEach((m) => {
      messages.push({ role: m.role === "ai" ? "assistant" : "user", content: m.content });
    });

    let userContent = text || "Hello";
    if (req.file) {
      userContent = [
        { type: "text", text: text || "What is in this image?" },
        { type: "image_url", image_url: { url: `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}` } },
      ];
    }
    messages.push({ role: "user", content: userContent });

    const result = await askAI(messages, 0.5);
    if (result.includes("__AI_")) {
      return res.json({ success: true, response: "AI connection trouble. Please try again." });
    }
    res.json({ success: true, response: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/* ── HISTORY ─────────────────────────────────────────────────────────────── */

app.post("/history/save-session", async (req, res) => {
  try {
    const { email, chatId, firstQuery, finalResult, mode } = req.body;
    await History.findOneAndUpdate(
      { chatId },
      {
        userEmail: email,
        $setOnInsert: { originalText: firstQuery || "New Chat" },
        $set: {
          translatedText: typeof finalResult === "string" ? finalResult : JSON.stringify(finalResult),
          mode: mode || "chat",
          updatedAt: new Date(),
        },
      },
      { upsert: true }
    );
    res.json({ success: true });
  } catch { res.status(500).json({ success: false }); }
});

app.get("/history", async (req, res) => {
  try {
    const history = await History.find({ userEmail: req.query.email }).sort({ updatedAt: -1 });
    res.json({ success: true, history });
  } catch { res.status(500).json({ success: false }); }
});

app.delete("/history/session/:chatId", async (req, res) => {
  try {
    await History.findOneAndDelete({ chatId: req.params.chatId, userEmail: req.query.email });
    res.json({ success: true });
  } catch { res.status(500).json({ success: false }); }
});

app.patch("/history/session/:chatId/pin", async (req, res) => {
  try {
    const h = await History.findOne({ chatId: req.params.chatId, userEmail: req.query.email });
    if (!h) return res.status(404).json({ success: false });
    h.pinned = !h.pinned;
    await h.save();
    res.json({ success: true, pinned: h.pinned });
  } catch { res.status(500).json({ success: false }); }
});

app.delete("/history", async (req, res) => {
  try {
    await History.deleteMany({ userEmail: req.query.email });
    res.json({ success: true });
  } catch { res.status(500).json({ success: false }); }
});

/* ── START ───────────────────────────────────────────────────────────────── */

app.listen(PORT, () => console.log(`Himalingo server running on port ${PORT}`));