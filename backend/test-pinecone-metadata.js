import { getVectorStore } from './config/pinecone.js';

async function testMetadata() {
  const vectorStore = await getVectorStore();
  if (!vectorStore) {
    console.log('Vector store not ready');
    process.exit(1);
  }

  // Test search for "three" in Bhutia
  console.log('Testing search for "three" in Bhutia...');
  const results = await vectorStore.similaritySearchWithScore('three', 5, { language: 'Bhutia' });
  
  console.log('\nMetadata & scores:');
  results.forEach(([doc, score], i) => {
    console.log(`Match ${i+1} (score: ${score.toFixed(3)}):`);
    console.log('Page content:', doc.pageContent.substring(0, 100) + '...');
    console.log('Metadata:', JSON.stringify(doc.metadata, null, 2));
    console.log('---');
  });

  // Test "water"
  console.log('\nTesting search for "water" in Bhutia...');
  const waterResults = await vectorStore.similaritySearchWithScore('water', 5, { language: 'Bhutia' });
  waterResults.forEach(([doc, score], i) => {
    console.log(`Match ${i+1} (score: ${score.toFixed(3)}):`);
    console.log('Page content:', doc.pageContent.substring(0, 100) + '...');
    console.log('Metadata:', JSON.stringify(doc.metadata, null, 2));
    console.log('---');
  });
}

async function main() {
  try {
    await testMetadata();
  } catch (error) {
    console.error('Test failed:', error);
  }
}

main();
