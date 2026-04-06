import os, json, uuid
from pinecone import Pinecone
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
index = pc.Index(os.getenv("PINECONE_INDEX_NAME"))
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

JSON_FOLDER = "./knowledge_base" 
BHUTIA_TXT_PATH = "../bhutia.txt"

def get_embedding(text):
    return client.embeddings.create(input=[text], model="text-embedding-3-small").data[0].embedding

def sync_all():
    print("🧹 Cleaning Pinecone Index...")
    index.delete(delete_all=True)

    # 1. Upload JSON Dictionaries
    if os.path.exists(JSON_FOLDER):
        for filename in os.listdir(JSON_FOLDER):
            if filename.endswith(".json"):
                lang = filename.replace(".json", "").capitalize()
                print(f"📦 Uploading {lang}...")
                with open(os.path.join(JSON_FOLDER, filename), 'r', encoding='utf-8') as f:
                    data = json.load(f)
                for entry in data:
                    text = f"Word: {entry.get('word')} | Translation: {entry.get('translation')}"
                    index.upsert([{
                        "id": str(uuid.uuid4()),
                        "values": get_embedding(text),
                        "metadata": {"text": text, "language": lang}
                    }])

    # 2. Upload Bhutia TXT
    if os.path.exists(BHUTIA_TXT_PATH):
        print("📄 Uploading Bhutia TXT...")
        with open(BHUTIA_TXT_PATH, 'r', encoding='utf-8') as f:
            lines = f.readlines()
        for line in lines:
            if len(line.strip()) > 5:
                index.upsert([{
                    "id": str(uuid.uuid4()),
                    "values": get_embedding(line.strip()),
                    "metadata": {"text": line.strip(), "language": "Bhutia"}
                }])
    print("✅ All languages synced!")

if __name__ == "__main__":
    sync_all()