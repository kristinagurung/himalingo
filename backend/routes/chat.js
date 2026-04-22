// routes/chat.js — handles /chat endpoint
import express from "express";
import multer  from "multer";
import { askAI } from "../services/aiService.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/chat", upload.single("image"), async (req, res) => {
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

export default router;