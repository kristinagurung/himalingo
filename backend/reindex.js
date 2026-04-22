#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { embeddings } from './config/pinecone.js';
import { PineconeStore } from '@langchain/pinecone';
import { Pinecone } from '@pinecone-database/pinecone';
import { Document } from '@langchain/core/documents';

const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
const pineconeIndex = pinecone.index(process.env.PINECONE_INDEX_NAME);

async function run() {
  const docs = [];

  // Load dictionary.json - added Bhutia support
  const jsonPath = "./data/dictionary.json";
  if (fs.existsSync(jsonPath)) {
    console.log("Loading dictionary.json...");
    const data = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
    const languages = {
      Lepcha: "lepcha",
      Limbu:  "limbu",
      Magar:  "magar",
      Rai:    "rai",
      Bhutia: "bhutia"
    };

    for (const entry of data) {
      const english = (entry.english || "").trim();
      if (!english) continue;

      for (const [langName, langKey] of Object.entries(languages)) {
        const native = (entry[langKey] || "").trim();
        const trans  = (entry[`transliteration_${langKey}`] || "").trim();
        if (!native && !trans) continue;

        docs.push(new Document({
          pageContent: `English: ${english} | ${langName}: ${native} | Transliteration: ${trans}`,
          metadata: {
            language:        langName,
            english:         english,
            native:          native,
            transliteration: trans,
          },
        }));
      }
    }
    console.log(`Loaded ${data.length} dictionary entries.`);
  }

  // Load Bhutia TXT
  const bhutiaPath = "./data/bhutia_full_question_bank.txt";
  if (fs.existsSync(bhutiaPath)) {
    console.log("Loading Bhutia text file...");
    const lines = fs.readFileSync(bhutiaPath, "utf-8").split("\n");
    let count = 0;
    for (const line of lines) {
      const text = line.trim();
      if (text.length < 5) continue;
      docs.push(new Document({
        pageContent: text,
        metadata: { language: "Bhutia" },
      }));
      count++;
    }
    console.log(`Loaded ${count} Bhutia lines.`);
  }

  if (docs.length === 0) {
    console.log("No documents found. Check data files.");
    process.exit(1);
  }

  // Upload to Pinecone
  console.log(`Uploading ${docs.length} documents to Pinecone...`);
  await PineconeStore.fromDocuments(docs, embeddings, {
    pineconeIndex,
  });
  console.log("✅ Indexing complete! RAG should now work for Bhutia translations.");
}

run().catch(console.error);
