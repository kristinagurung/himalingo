import sys
import os
from pinecone import Pinecone
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

def main():
    if len(sys.argv) != 3:
        print("ERROR: Usage: python3 search_pinecone.py <query> <language>")
        sys.exit(1)

    query_text = sys.argv[1]
    target_lang = sys.argv[2].strip().capitalize()  # e.g. "magar" -> "Magar"

    openrouter_key = os.getenv("OPENROUTER_API_KEY")
    if not openrouter_key:
        print("ERROR: OPENROUTER_API_KEY not set")
        sys.exit(1)

    pinecone_key = os.getenv("PINECONE_API_KEY")
    index_name = os.getenv("PINECONE_INDEX_NAME")

    client = OpenAI(
        base_url="https://openrouter.ai/api/v1",
        api_key=openrouter_key,
    )

    pc = Pinecone(api_key=pinecone_key)
    index = pc.Index(index_name)

    try:
        # Generate 384-dim embedding for query
        xq = client.embeddings.create(
            input=[query_text],
            model="openai/text-embedding-3-small",
            dimensions=384
        ).data[0].embedding

        # Query with language metadata filter
        res = index.query(
            vector=xq,
            top_k=5,
            include_metadata=True,
            filter={"language": {"$eq": target_lang}}
        )

        if res.matches:
            context = "\n".join([match.metadata["text"] for match in res.matches])
            print(context)
        else:
            print("NO_MATCH")

    except Exception as e:
        print(f"ERROR: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()
