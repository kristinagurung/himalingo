// routes/translate.js — handles /translate endpoint
import express from "express";
import multer  from "multer";
import { getRagContext } from "../services/ragService.js";
import { askAI }         from "../services/aiService.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

const SUPPORTED_LANGUAGES = ["Bhutia", "Lepcha", "Limbu", "Magar", "Rai", "Nepali"];

router.post("/translate", upload.single("image"), async (req, res) => {
  try {
    const { text, targetLanguage, mode } = req.body;

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

    // 2. Build strict one-line system prompt
    const systemPrompt = `You are a strict ${lang} translator. You only translate into ${lang}.
NEVER translate into Sherpa, Nepali, Hindi, Tibetan, or any other language.

ABSOLUTE RULES:
- Output ONE LINE only. Nothing else.
- Output ONLY the ${lang} transliteration in Roman script
- Do NOT output bullet points or multiple options
- Do NOT output formal/informal variations
- Do NOT output explanations or alternatives
- Do NOT output native script (no Tibetan, Devanagari etc)
- Do NOT output the English word
- ONE LINE. ONE TRANSLATION. NOTHING ELSE.

${context
  ? `Use this verified ${lang} data and pick the single best match:\n${context}`
  : `Translate into ${lang} Roman script.`
}

Example correct output for "Hello" in Bhutia:
Kuzu Zangpo

Example correct output for "How are you?" in Bhutia:
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

    // 5. Clean output — first line only, strip bullets and quotes
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

export default router;