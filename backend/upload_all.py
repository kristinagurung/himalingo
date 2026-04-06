import os
import json
import uuid
from pinecone import Pinecone
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

openrouter_key = os.getenv("OPENROUTER_API_KEY")
pinecone_key = os.getenv("PINECONE_API_KEY")
index_name = os.getenv("PINECONE_INDEX_NAME")

client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=openrouter_key,
)

pc = Pinecone(api_key=pinecone_key)
index = pc.Index(index_name)

JSON_PATH = "./knowledge_base/dictionary.json"
BHUTIA_TXT_PATH = "../bhutia_full_question_bank.txt"

def get_embedding(text):
    response = client.embeddings.create(
        input=[text],
        model="openai/text-embedding-3-small",
        dimensions=384
    )
    return response.data[0].embedding

def sync_data():
    print("🧹 Deleting all data in Pinecone index...")
    index.delete(delete_all=True)
    print("✅ Index cleared.")

    vectors = []
    batch_size = 100

    # Parse dictionary.json for all languages
    print("📦 Processing dictionary.json...")
    with open(JSON_PATH, 'r', encoding='utf-8') as f:
        data = json.load(f)

    languages = {
        "Lepcha": "lepcha",
        "Limbu": "limbu", 
        "Magar": "magar",
        "Rai": "rai"
    }

    for entry in data:
        english = entry.get("english", "")
        for lang_name, lang_key in languages.items():
            native = entry.get(lang_key, "")
            trans = entry.get(f"transliteration_{lang_key}", "")
            if native or trans:
                text_content = f"English: {english} | {lang_name}: {native.strip()} | Transliteration: {trans.strip()}"
                vec_id = str(uuid.uuid4())
                vectors.append({
                    "id": vec_id,
                    "values": get_embedding(text_content),
                    "metadata": {"text": text_content, "language": lang_name}
                })

                if len(vectors) >= batch_size:
                    index.upsert(vectors=vectors)
                    print(f"Uploaded {len(vectors)} vectors for dictionary...")
                    vectors = []

    # Upload remaining dictionary vectors
    if vectors:
        index.upsert(vectors=vectors)
        print("✅ Dictionary data uploaded.")

    # Upload Bhutia text file
    vectors = []
    if os.path.exists(BHUTIA_TXT_PATH):
        print("📄 Uploading Bhutia data...")
        with open(BHUTIA_TXT_PATH, 'r', encoding='utf-8') as f:
            lines = f.readlines()
        
        for line in lines:
            line = line.strip()
            if len(line) > 5:
                vec_id = str(uuid.uuid4())
                vectors.append({
                    "id": vec_id,
                    "values": get_embedding(line),
                    "metadata": {"text": line, "language": "Bhutia"}
                })

                if len(vectors) >= batch_size:
                    index.upsert(vectors=vectors)
                    print(f"Uploaded {len(vectors)} Bhutia vectors...")
                    vectors = []

        if vectors:
            index.upsert(vectors=vectors)
            print("✅ Bhutia data uploaded.")
    else:
        print("⚠️ Bhutia file not found, skipping.")

    print("🎉 All data synced with proper 384-dim embeddings and language metadata!")

if __name__ == "__main__":
    sync_data()
