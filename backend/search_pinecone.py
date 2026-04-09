import sys, os
from pinecone import Pinecone
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

def main():
    # 1. Check arguments (Node.js passes: query, language)
    if len(sys.argv) < 3:
        return
    
    query = sys.argv[1]
    target_lang = sys.argv[2].strip().capitalize()

    try:
        # 2. Setup Clients
        pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
        index = pc.Index(os.getenv("PINECONE_INDEX_NAME"))
        client = OpenAI(
            base_url="https://openrouter.ai/api/v1",
            api_key=os.getenv("OPENROUTER_API_KEY")
        )

        # 3. Generate Embedding (Force 384 dimensions for your index)
        response = client.embeddings.create(
            input=[query],
            model="openai/text-embedding-3-small",
            dimensions=384
        )
        xq = response.data[0].embedding

        # 4. Query Pinecone with Metadata Filter
        res = index.query(
            vector=xq,
            top_k=10,
            include_metadata=True,
            filter={"language": {"$eq": target_lang}}
        )

        # 5. Output results for Node.js to read
        if res['matches']:
            # Join all metadata text into one string
            results = [m['metadata']['text'] for m in res['matches']]
            print(" | ".join(results))
        else:
            print("NO_MATCH")

    except Exception as e:
        sys.stderr.write(f"Python Error: {str(e)}\n")
        print("ERROR")

if __name__ == "__main__":
    main()