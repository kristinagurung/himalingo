import { getVectorStore } from "./config/pinecone.js";
import 'dotenv/config';

async function check() {
  try {
    const vs = await getVectorStore();
    const index = vs.lc_kwargs.index; // Get the raw index object
    const stats = await index.describeIndexStats();
    
    print("--- Pinecone Stats ---");
    console.log("Total Vectors:", stats.totalVectorCount);
    console.log("Namespaces/Languages:", stats.namespaces);
  } catch (err) {
    console.error("Error:", err.message);
  }
}
check();