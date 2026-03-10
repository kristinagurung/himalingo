const path = require("path");
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const multer = require("multer");
const fetch = require("node-fetch");
const { execSync } = require("child_process");

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(express.json());
const upload = multer({ storage: multer.memoryStorage() });

/* ---------------------- DATABASE ---------------------- */

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Error:", err.message));

const HistorySchema = new mongoose.Schema({
  chatId: { type: String, unique: true, required: true },
  userEmail: { type: String, required: true },
  originalText: String,
  translatedText: String,
  mode: String,
  updatedAt: { type: Date, default: Date.now },
});

const UserSchema = new mongoose.Schema({
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
});

const History = mongoose.models.History || mongoose.model("History", HistorySchema);
const User = mongoose.models.User || mongoose.model("User", UserSchema);

/* ---------------------- RAG HELPER ---------------------- */

// This function calls your Python script to search ChromaDB
function getLocalLanguageContext(query, lang) {
  try {
    const searchLang = lang.toLowerCase().trim();
    const safeQuery = query.replace(/"/g, '\\"');
    const pythonScriptPath = path.join(__dirname, "search_for_node.py");
    
    console.log(`[RAG DEBUG] Searching DB for: "${query}" in ${searchLang}`);

    // Call Python script
    const result = execSync(`python "${pythonScriptPath}" "${safeQuery}" "${searchLang}"`, { 
        encoding: 'utf-8',
        timeout: 8000 
    }).trim();
    
    if (result && result !== "NO_MATCH" && !result.includes("Traceback")) {
      console.log(`[RAG DEBUG] Success! Found: ${result}`);
      return result;
    }
    return null;
  } catch (error) {
    console.error("[RAG ERROR]", error.message);
    return null;
  }
}

/* ---------------------- AI HELPER ---------------------- */

async function askAI(question, imageFile, chatHistory = [], systemInstruction = "") {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const models = ["google/gemini-2.0-flash-001", "meta-llama/llama-3.3-70b-instruct:free"];

  let content = imageFile ? [
    { type: "text", text: question },
    { type: "image_url", image_url: { url: `data:${imageFile.mimetype};base64,${imageFile.buffer.toString("base64")}` } }
  ] : question;

  const messages = [];
  
  // Add System Instruction if provided (Important for RAG)
  if (systemInstruction) {
    messages.push({ role: "system", content: systemInstruction });
  }

  // Add History
  chatHistory.forEach(m => {
    messages.push({
      role: m.role === "ai" ? "assistant" : "user",
      content: m.content
    });
  });

  // Add current message
  messages.push({ role: "user", content });

  for (const modelId of models) {
    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ model: modelId, messages, temperature: 0.0 }) 
      });
      const data = await response.json();
      if (data.choices?.[0]?.message?.content) return data.choices[0].message.content;
    } catch (e) { console.error(`AI ${modelId} failed:`, e.message); }
  }
  return "AI Error";
}

/* ---------------------- AUTH ROUTES ---------------------- */

app.post("/api/signup", async (req, res) => {
  try {
    const { email, password } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ success: false, message: "User exists" });
    const newUser = new User({ email, password });
    await newUser.save();
    res.json({ success: true, token: "login-token" });
  } catch (err) { res.status(500).json({ success: false }); }
});

app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email, password });
    if (!user) return res.status(401).json({ success: false, message: "Invalid credentials" });
    res.json({ success: true, token: "login-token" });
  } catch (err) { res.status(500).json({ success: false }); }
});

/* ---------------------- TRANSLATE ROUTE ---------------------- */

app.post('/translate', upload.single("image"), async (req, res) => {
  try {
    const { text, targetLanguage } = req.body;
    let context = "";
    let systemInstruction = "You are a specialized translator.";

    // 1. RAG LOGIC: Check ChromaDB via Python Helper
    if (targetLanguage === "Bhutia" || targetLanguage === "Lepcha") {
      const foundInfo = getLocalLanguageContext(text, targetLanguage);
      if (foundInfo) {
        context = foundInfo;
        systemInstruction = `You are a translator for ${targetLanguage}. 
        STRICT RULE: Use the following verified translation information: ${context}. 
        Do NOT use Nepali script or words. Output ONLY the ${targetLanguage} translation.`;
      }
    } else {
        systemInstruction = `Translate the text to ${targetLanguage}. Provide ONLY the translated text.`;
    }

    // 2. Ask AI with the context/instruction
    const aiResult = await askAI(`Translate "${text}" to ${targetLanguage}`, req.file, [], systemInstruction);
    
    // Clean up result (remove quotes/dots as you did before)
    const finalResult = aiResult.replace(/[".!]/g, "").trim();

    res.json({ success: true, translated: finalResult });
  } catch (err) {
    console.error("Translate Error:", err);
    res.status(500).json({ success: false });
  }
});

/* ---------------------- CHAT & HISTORY ---------------------- */

app.post("/chat", upload.single("image"), async (req, res) => {
  try {
    const { text, history } = req.body;
    const parsedHistory = typeof history === "string" ? JSON.parse(history) : history || [];
    const result = await askAI(text || "Hello", req.file, parsedHistory, "You are Himalingo, a helpful assistant.");
    res.json({ success: true, response: result });
  } catch (err) { res.status(500).json({ success: false }); }
});

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
  } catch (err) { res.status(500).json({ success: false }); }
});

app.get("/history", async (req, res) => {
  try {
    const history = await History.find({ userEmail: req.query.email }).sort({ updatedAt: -1 });
    res.json({ success: true, history });
  } catch (err) { res.status(500).json({ success: false }); }
});

app.delete("/history/session/:chatId", async (req, res) => {
  try {
    await History.findOneAndDelete({ chatId: req.params.chatId, userEmail: req.query.email });
    res.json({ success: true });
  } catch { res.status(500).json({ success: false }); }
});

app.listen(PORT, () => console.log(`🚀 Himalingo Server running on port ${PORT}`));