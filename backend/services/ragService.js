// services/ragService.js — searches Pinecone for translation context
// Uses vectorStore from pinecone.js (already connected, fast)

import { getVectorStore } from "../config/pinecone.js";

export async function getRagContext(query, language) {
  try {
    const vectorStore = await getVectorStore();

    if (!vectorStore) {
      console.warn("[RAG] Vector store not ready");
      return null;
    }

    console.log(`[RAG] Searching "${query}" in ${language}...`);

    // Search with language filter — only returns results for requested language
    // This stops Magar queries returning Bhutia results
    const results = await vectorStore.similaritySearchWithScore(
      query,
      5,
      { language: language }
    );

    if (!results || results.length === 0) {
      console.log(`[RAG] No matches for "${language}"`);
      return null;
    }

    // Drop weak matches — below 0.30 means not relevant enough
    const goodResults  = results.filter(([, score]) => score >= 0.30);
    const finalResults = goodResults.length > 0 ? goodResults : results.slice(0, 3);

    const parts = finalResults
      .map(([doc]) => doc.pageContent)
      .filter(Boolean);

    if (parts.length === 0) return null;

    console.log(`[RAG] Found ${finalResults.length} matches`);
    return parts.join("\n");

  } catch (err) {
    console.error("[RAG] Error:", err.message);
    return null;
  }
}