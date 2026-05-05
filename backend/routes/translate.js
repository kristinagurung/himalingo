// routes/translate.js
import express from "express";
import multer  from "multer";
import { getRagContext } from "../services/ragService.js";
import { askAI }         from "../services/aiService.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// ── Helpers ───────────────────────────────────────────────────────────────

// Check if AI just returned the English word back unchanged
function isEcho(result, query) {
  const r = result.toLowerCase().replace(/[^a-z0-9 ]/g, "").trim();
  const q = query.toLowerCase().replace(/[^a-z0-9 ]/g, "").trim();
  return r === q || r.includes(q) || q.includes(r);
}

// Check if result contains English words (bad output)
function hasEnglish(result) {
  const commonEnglish = ["the","is","are","you","how","what","good","morning","thank","hello","please","yes","no","my","name","water","food","mother","father","sister","brother","life","earth","heaven"];
  const words = result.toLowerCase().split(" ");
  return words.some(w => commonEnglish.includes(w));
}

// Clean up AI output
function cleanOutput(text) {
  return text
    .split("\n")[0]                                    // first line only
    .replace(/.*is translated as:?/gi, "")
    .replace(/.*can be translated as:?/gi, "")
    .replace(/.*in bhutia.*is:?/gi, "")
    .replace(/.*transliteration.*is:?/gi, "")
    .replace(/^[\d\.\-\*\•]+\s*/, "")                 // remove bullet/number
    .replace(/["'""''`]/g, "")                        // remove quotes
    .trim();
}

// ── Route ─────────────────────────────────────────────────────────────────

router.post("/translate", upload.single("image"), async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ success: false, error: "No text provided" });
    }

    // 1. Clean query for RAG search
    const cleanQuery = text
      .replace(/translate|to bhutia|into bhutia|in bhutia|what is|how is|say|word/gi, "")
      .replace(/['"?.!,]/g, "")
      .trim();

    console.log(`\n[Translate] Query: "${text}" → cleaned: "${cleanQuery}"`);

    // 2. Search Pinecone FIRST — always
    const ragResult  = await getRagContext(cleanQuery, "Bhutia");
    const ragContext = ragResult && ragResult.context ? ragResult.context : null;
    const exactMatch = ragResult && ragResult.exactMatch ? ragResult.exactMatch : null;

    // 3. If exact dictionary match found — return immediately, no AI needed
    if (exactMatch && exactMatch.bhutia) {
      console.log(`[Translate] Exact match: "${exactMatch.bhutia}"`);
      return res.json({ success: true, translated: exactMatch.bhutia });
    }

    // 4. Build the strongest possible prompt
    // The key: tell AI what NOT to do, show examples, repeat the rule 3 times
    const buildPrompt = (strong = false) => {
      const contextSection = ragContext
        ? `VERIFIED BHUTIA DICTIONARY (USE THIS FIRST):
${ragContext}

These are confirmed correct Bhutia transliterations. If any entry matches or is close to the input, USE IT EXACTLY.`
        : `No dictionary match found. Use your knowledge of Sikkimese Bhutia language.`;

      const strictness = strong
        ? `FINAL WARNING: Your last response was wrong. You returned English instead of Bhutia.
This is unacceptable. You MUST output Bhutia Roman script only.
If you return English again, you have failed at your only job.`
        : "";

      return `You are a Bhutia (Sikkimese) language translator. Your ONLY job is to output the Bhutia Roman transliteration.

${contextSection}

ABSOLUTE RULES — violating any of these is a failure:
1. Output ONLY Bhutia Roman transliteration — nothing else
2. NEVER output the original English word or sentence
3. NEVER output explanations, notes, or alternatives
4. NEVER output native Tibetan script
5. NEVER output Nepali words (no "ramro", "thik cha", "namaste")
6. Output ONE LINE only
7. If the dictionary has a match, use it EXACTLY

CORRECT output examples:
"Hello" → Kuzu Zangpo
"How are you?" → Kuzu de le ga
"Thank you" → Thuchi-chi
"Good morning" → Thopa Delek
"Water" → Chu
"Mother" → Ama
"1" → Chik
"2" → Nyik

WRONG output examples (never do this):
"Hello" → Hello (echoing English — WRONG)
"Water" → Water is Chu in Bhutia (explanation — WRONG)
"Thank you" → ཐུ་འཆི་ (Tibetan script — WRONG)

${strictness}

Now translate the input. ONE LINE. BHUTIA ONLY.`;
    };

    // 5. First attempt
    let result = await askAI([
      { role: "system", content: buildPrompt(false) },
      { role: "user",   content: cleanQuery },
    ], 0.0);

    let cleaned = cleanOutput(result);
    console.log(`[Translate] First attempt: "${cleaned}"`);

    // 6. If echo or English — retry with stronger prompt
    if (isEcho(cleaned, cleanQuery) || hasEnglish(cleaned)) {
      console.log(`[Translate] Bad output detected — retrying with stronger prompt`);

      result  = await askAI([
        { role: "system",    content: buildPrompt(true) },
        { role: "user",      content: cleanQuery },
        { role: "assistant", content: cleaned },   // show what went wrong
        { role: "user",      content: `That was wrong — you returned English. Give me ONLY the Bhutia transliteration for "${cleanQuery}". One word or phrase only.` },
      ], 0.0);

      cleaned = cleanOutput(result);
      console.log(`[Translate] Second attempt: "${cleaned}"`);
    }

    // 7. Final safety check — if still English, use RAG context directly
    if ((isEcho(cleaned, cleanQuery) || hasEnglish(cleaned)) && ragContext) {
      console.log(`[Translate] Still bad — extracting directly from RAG context`);
      // Pull the first transliteration from RAG context
      const lines = ragContext.split("\n");
      for (const line of lines) {
        const match = line.match(/[Tt]ransliteration[:\s]+([A-Za-z\s']+)/);
        if (match && match[1]) {
          cleaned = match[1].trim();
          break;
        }
      }
    }

    console.log(`[Translate] Final result: "${cleaned}"`);
    res.json({ success: true, translated: cleaned });

  } catch (err) {
    console.error("[Translate Error]:", err.message);
    res.status(500).json({ success: false, error: "Translation failed" });
  }
});

export default router;