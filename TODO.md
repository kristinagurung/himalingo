# Himalingo RAG Fix - Credentials Needed

**Error:** Missing PINECONE_API_KEY / PINECONE_INDEX_NAME in backend/.env

## Quick Fix:
1. Go https://app.pinecone.io → Create **serverless index** `himalingo-dictionary` (dim=1536, cosine)
2. Copy API Key
3. **Edit backend/.env** (create if missing):
   ```
   PINECONE_API_KEY=abc123... 
   PINECONE_INDEX_NAME=himalingo-dictionary
   ```
4. ```
   cd backend && node reindex.js
   ```
5. ```
   cd backend && node test-pinecone-metadata.js
   ```
6. Restart server `node server.js`

**Data/reindex.js ready. Just needs keys!** 🚀
