import { searchPinecone } from "../config/pinecone.js";

/**
 * getRagContext
 * Searches Pinecone for the most relevant Bhutia translations
 * and returns them as a context string for the AI.
 */
export async function getRagContext(query, language) {
  try {
    const formattedLang = language.charAt(0).toUpperCase() + language.slice(1).toLowerCase();
    
    // 1. CLEANING: Remove punctuation so "ten?" becomes "ten"
    const sanitizedQuery = query.replace(/['"?.!,]/g, "").trim();
    
    console.log(`[RAG] Searching for: "${sanitizedQuery}" in ${formattedLang}...`);

    // 2. PINECONE SEARCH: Get top 5 matches
    const matches = await searchPinecone(sanitizedQuery, formattedLang, 5);

    if (!matches || matches.length === 0) {
      console.log(`[RAG] No matches found in Pinecone for "${sanitizedQuery}"`);
      return null;
    }

    // 3. THRESHOLD: We use 0.20 for numbers/short words, 0.40 is usually better for sentences.
    // To be safe for all, we will use 0.25 here.
    const goodMatches = matches.filter(m => m.score >= 0.15);

    if (goodMatches.length === 0) {
      console.log(`[RAG] Highest score (${matches[0].score}) was below threshold.`);
      return null;
    }

    // 4. MAPPING: Standardizing all your JSON key possibilities
    const exactQuery = sanitizedQuery.toLowerCase();
    let exactMatch = null;

    const contextParts = goodMatches.map(m => {
      const meta = m.metadata || {};
      
      // This looks for 'english' (new), 'English' (old), 'number' (old), or 'text'
      const eng = meta.english || meta.English || meta.number || meta.text || "";
      // This looks for 'bhutia' (new) or 'transliteration'/'native' (old)
      const bhu = meta.bhutia || meta.transliteration || meta.native || "";

      if (eng && bhu) {
        const normalizedEng = eng.replace(/['"?.!,]/g, "").trim().toLowerCase();
        if (!exactMatch && normalizedEng === exactQuery) {
          exactMatch = { english: eng, bhutia: bhu };
        }
        return `Dictionary entry: "${eng}" translates to Bhutia word "${bhu}"`;
      }
      return null;
    }).filter(Boolean);

    if (contextParts.length === 0) return null;

    // Remove duplicates (in case "One" and "1" both return "Chi")
    const uniqueContext = [...new Set(contextParts)];

    console.log(`[RAG] Found ${uniqueContext.length} relevant dictionary matches.`);
    return { context: uniqueContext.join("\n"), exactMatch };

  } catch (err) {
    console.error("[RAG Error]:", err.message);
    return null;
  }
}