import { NextResponse } from 'next/server';
import { Pinecone } from '@pinecone-database/pinecone';
import { pipeline, env } from '@xenova/transformers';
import fs from 'fs';
import path from 'path';

// Cache pipeline
let embeddingPipeline = null;
async function getEmbeddingPipeline() {
  if (!embeddingPipeline) {
    env.allowLocalModels = false;
    env.allowRemoteModels = true;
    embeddingPipeline = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  }
  return embeddingPipeline;
}

function generateId(text, source) {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `all_${source}_${Math.abs(hash).toString(36)}`;
}

// ALL JSON files to process
const JSON_FILES = [
  'Bhutia.json',
  'Limbu.json', 
  'Magar.json',
  'Rai.json',
  'bhutia_dictionary.json',
  'bhutia_mcq_bank.json',
  'bhutia_lessons.json',
  'clean_bhutia_conversations.json',
  'final_bhutia_mcqs.json',
  'food_conversations.json',
  'separated_bhutia_mcqs.json',
  'bhutia_full_question_bank.json'
];

export async function POST(request) {
  try {
    const { clearFirst = false } = await request.json(); // Optional: clear namespace first

    const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
    const index = pinecone.index(process.env.PINECONE_INDEX_NAME);

    const pipe = await getEmbeddingPipeline();

    let totalCount = 0;
    const sources = [];

    for (const filename of JSON_FILES) {
      try {
        const jsonPath = path.join(process.cwd(), '..', '..', 'backend', 'data', filename);
        const rawData = fs.readFileSync(jsonPath, 'utf8');
        const data = JSON.parse(rawData);

        const vectors = [];
        for (let i = 0; i < data.length; i++) {
          const item = data[i];
          
          // Flexible text extraction (handles different structures)
          let text = '';
metadata = { language: 'Bhutia', source: filename.replace('.json', ''), index: i };
          
          if (item.english && item.bhutia) {
            // Dictionary format
            text = `${item.english} = ${item.bhutia}`;
            metadata = { ...metadata, english: item.english, bhutia: item.bhutia, transliteration: item.transliteration_bhutia || '' };
          } else if (typeof item === 'string') {
            // Simple text arrays
            text = item;
            metadata.text = item;
          } else {
            // Generic objects - concatenate keys/values
            text = Object.entries(item).map(([k, v]) => `${k}:${v}`).join(' ');
            metadata.raw = item;
          }

          if (!text.trim()) continue;

          const output = await pipe(text, { pooling: 'mean', normalize: true });
          const embedding = Array.from(output.data);

          vectors.push({
            id: generateId(text, filename),
            values: embedding,
            metadata
          });
        }

        // Upsert batch
        if (vectors.length > 0) {
          const batchSize = 100;
          for (let j = 0; j < vectors.length; j += batchSize) {
            await index.upsert({ vectors: vectors.slice(j, j + batchSize) });
          }
          sources.push({ file: filename, count: vectors.length });
          totalCount += vectors.length;
        }
      } catch (fileError) {
        console.warn(`Skipped ${filename}:`, fileError.message);
      }
    }

    return NextResponse.json({
      success: true,
      total: totalCount,
      files: sources,
      message: `Inserted ${totalCount} vectors from ${sources.length} files`,
      clearFirst
    });

  } catch (error) {
    console.error('Insert-all error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
