// /**
//  * Generate embeddings using your preferred provider
//  * Options: Hugging Face, Cohere, Voyage AI, or local models
//  */

// // Option A: Using Hugging Face (Free tier available)
// async function getEmbeddingHuggingFace(text) {
//   const response = await fetch(
//     'https://api-inference.huggingface.co/models/sentence-transformers/all-MiniLM-L6-v2',
//     {
//       method: 'POST',
//       headers: {
//         'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify({ inputs: text }),
//     }
//   );

//   const result = await response.json();
//   return result;
// }

// // Option B: Using Cohere (Good for multilingual)
// async function getEmbeddingCohere(text) {
//   const response = await fetch('https://api.cohere.ai/v1/embed', {
//     method: 'POST',
//     headers: {
//       'Authorization': `Bearer ${process.env.COHERE_API_KEY}`,
//       'Content-Type': 'application/json',
//     },
//     body: JSON.stringify({
//       texts: [text],
//       model: 'embed-multilingual-v3.0',
//       input_type: 'search_query'
//     }),
//   });

//   const result = await response.json();
//   return result.embeddings[0];
// }

// // Option C: Using Voyage AI (Best for RAG)
// async function getEmbeddingVoyage(text) {
//   const response = await fetch('https://api.voyageai.com/v1/embeddings', {
//     method: 'POST',
//     headers: {
//       'Authorization': `Bearer ${process.env.VOYAGE_API_KEY}`,
//       'Content-Type': 'application/json',
//     },
//     body: JSON.stringify({
//       input: text,
//       model: 'voyage-2'
//     }),
//   });

//   const result = await response.json();
//   return result.data[0].embedding;
// }

// // Choose your provider here
// export async function getEmbedding(text) {
//   try {
//     // Change this based on your provider
//     const provider = process.env.EMBEDDING_PROVIDER || 'huggingface';

//     switch (provider) {
//       case 'huggingface':
//         return await getEmbeddingHuggingFace(text);
//       case 'cohere':
//         return await getEmbeddingCohere(text);
//       case 'voyage':
//         return await getEmbeddingVoyage(text);
//       default:
//         throw new Error(`Unknown embedding provider: ${provider}`);
//     }
//   } catch (error) {
//     console.error('[Embedding] Error:', error.message);
//     throw error;
//   }
// }