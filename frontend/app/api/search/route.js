import { NextResponse } from 'next/server';
import { Pinecone } from '@pinecone-database/pinecone';
import { pipeline, env } from '@xenova/transformers';

// Same cached pipeline
let embeddingPipeline = null;
async function getEmbeddingPipeline() {
  if (!embeddingPipeline) {
    env.allowLocalModels = false;
    env.allowRemoteModels = true;
    embeddingPipeline = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  }
  return embeddingPipeline;
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    if (!query) {
      return NextResponse.json({ error: 'Missing ?q= query parameter' }, { status: 400 });
    }

    const pipe = await getEmbeddingPipeline();

    // Generate embedding for query
    const queryOutput = await pipe(query, { pooling: 'mean', normalize: true });
    const queryEmbedding = Array.from(queryOutput.data);

    const pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY,
    });
    const index = pinecone.index(process.env.PINECONE_INDEX_NAME);

    const results = await index.query({
      vector: queryEmbedding,
      topK: 3,
      includeMetadata: true
    });

    const matches = results.matches.map(match => ({
      score: match.score,
      ...match.metadata
    }));

    return NextResponse.json({
      query,
      results: matches,
      count: matches.length
    });

  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: error.message || 'Search failed' },
      { status: 500 }
    );
  }
}
