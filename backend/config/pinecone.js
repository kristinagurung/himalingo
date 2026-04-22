// config/pinecone.js — Pinecone + vectorStore setup
// vectorStore is initialized ONCE when server starts
// All services import vectorStore from here

import { Pinecone as PineconeClient } from "@pinecone-database/pinecone";
import { PineconeStore }              from "@langchain/pinecone";
import { OpenAIEmbeddings }           from "@langchain/openai";

// Embeddings — uses your direct OpenAI key
export const embeddings = new OpenAIEmbeddings({
  apiKey:     process.env.GPT5_NANO_API_KEY,
  modelName:  "text-embedding-3-small",
  dimensions: 1024,
});

// Pinecone client with validation
let pineconeIndex = null;
if (!process.env.PINECONE_API_KEY || !process.env.PINECONE_INDEX_NAME) {
  console.error("🚫 RAG DISABLED: Missing PINECONE_API_KEY or PINECONE_INDEX_NAME in .env");
  console.error("   Create free: https://app.pinecone.io , dim=384 serverless");
} else {
  try {
    const pinecone = new PineconeClient({ apiKey: process.env.PINECONE_API_KEY });
    pineconeIndex = pinecone.Index(process.env.PINECONE_INDEX_NAME);
    console.log("✅ Pinecone client ready");
  } catch (err) {
    console.error("🚫 Pinecone client failed:", err.message);
  }
}

// vectorStore — initialized once, reused for every search
// This is the main speed optimization — no reconnecting on every request
let vectorStore = null;

export async function getVectorStore() {
  if (!vectorStore) {
    try {
      if (pineconeIndex) {
        vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
          pineconeIndex,
        });
        console.log("✅ Pinecone vector store ready");
      } else {
        console.log("⏭️ Skipping Pinecone init (RAG disabled)");
      }
    } catch (err) {
      console.error("🚫 Pinecone store failed:", err.message);
    }
  }
  return vectorStore;
}

// Initialize immediately when server starts
getVectorStore();