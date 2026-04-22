import { OpenAIEmbeddings } from "@langchain/openai";
import { PineconeStore } from "@langchain/pinecone";
import { Pinecone as PineconeClient } from "@pinecone-database/pinecone";
import { Document } from "@langchain/core/documents";
import fs from "fs";
import path from "path";
import "dotenv/config";

async function run() {
  // 1. Embeddings using your direct OpenAI key
  const embeddings = new OpenAIEmbeddings({
    apiKey:     process.env.GPT5_NANO_API_KEY,
    modelName:  "text-embedding-3-small",
    dimensions: 384,
  });

  // 2. Pinecone
  const pinecone      = new PineconeClient({ apiKey: process.env.PINECONE_API_KEY });
  const pineconeIndex = pinecone.Index(process.env.PINECONE_INDEX_NAME);

  const docs = [];

  // 3. Load JSON dictionary (Lepcha, Limbu, Magar, Rai)
  const jsonPath = "./data/dictionary.json";
  if (fs.existsSync(jsonPath)) {
    console.log("Loading dictionary.json...");
    const data = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
    const languages = {
      Lepcha: "lepcha",
      Limbu:  "limbu",
      Magar:  "magar",
      Rai:    "rai",
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
    console.log(`Loaded ${docs.length} dictionary entries.`);
  }

  // 4. Load Bhutia TXT
  const bhutiaPath = "./bhutia_full_question_bank.txt";
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

  // 5. Upload to Pinecone
  console.log(`Uploading ${docs.length} documents to Pinecone...`);
  const response = await PineconeStore.fromDocuments(docs, embeddings, {
    pineconeIndex,
    maxConcurrency: 5,
  });
  console.log("Pinecone upload response:", response);
  console.log("Done! Knowledge base synced to Pinecone.");
}

run().catch(console.error);