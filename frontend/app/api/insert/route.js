import { NextResponse } from 'next/server';
import { Pinecone } from '@pinecone-database/pinecone';
import { pipeline, env } from '@xenova/transformers';
import fs from 'fs';
import path from 'path';

// Cache the embedding pipeline (singleton)
let embeddingPipeline = null;
async function getEmbeddingPipeline() {
  if (!embeddingPipeline) {
    env.allowLocalModels = false;
    env.allowRemoteModels = true;
    embeddingPipeline = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  }
  return embeddingPipeline;
}

// Simple hash for ID
function generateId(text) {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit int
  }
  return Math.abs(hash).toString(36);
}

export async function POST() {
  try {
    // Read JSON data
    const jsonPath = path.join(process.cwd(), 'backend/knowledge_base/Bhutia.json');
    const rawData = fs.readFileSync(jsonPath, 'utf8');
    const data = JSON.parse(rawData);

    const pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY,
    });
    const index = pinecone.index(process.env.PINECONE_INDEX_NAME);

    const pipe = await getEmbeddingPipeline();

    const vectors = [];
    for (let i = 0; i < data.length; i++) {
      const item = data[i];
      const text = `${item.english} = ${item.bhutia}`;
      const output = await pipe(text, { pooling: 'mean', normalize: true });
      const embedding = Array.from(output.data);

      vectors.push({
        id: generateId(text) + '_' + i, // unique ID
        values: embedding, // dim 384
        metadata: {
          english: item.english,
          bhutia: item.bhutia,
          transliteration: item.transliteration_bhutia || '',
          text: text,
          source: 'Bhutia.json'
        }
      });
    }

    // Upsert in batches of 100 (Pinecone limit)
    const batchSize = 100;
    for (let i = 0; i < vectors.length; i += batchSize) {
      const batch = vectors.slice(i, i + batchSize);
      await index.upsert({ vectors: batch });
    }

    return NextResponse.json({
      success: true,
      count: data.length,
      message: `Inserted ${data.length} vectors into Pinecone`
    });

  } catch (error) {
    console.error('Insert error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to insert data' },
      { status: 500 }
    );
  }
}
