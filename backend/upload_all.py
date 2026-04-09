import os
import json
import uuid
import time
import sys
import socket
from pinecone import Pinecone
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

client = OpenAI(
    api_key=os.getenv("OPENROUTER_API_KEY"),
    base_url="https://openrouter.ai/api/v1",
)

# Network connectivity check with retry
def check_pinecone_connectivity(max_retries=3, delay=2):
    host = "api.pinecone.io"
    port = 443
    for attempt in range(max_retries):
        try:
            socket.create_connection((host, port), timeout=5)
            print(f"✅ Connected to Pinecone API (attempt {attempt + 1}/{max_retries})")
            return True
        except (socket.gaierror, socket.error) as e:
            print(f"⚠️  Connection attempt {attempt + 1}/{max_retries} failed: {e}")
            if attempt < max_retries - 1:
                time.sleep(delay * (2 ** attempt))  # Exponential backoff
    return False

# Check args for offline mode
offline_mode = "--offline" in sys.argv

if offline_mode:
    print("🧪 OFFLINE MODE: Validating local files only (no Pinecone upload)")
    index = None
else:
    if not check_pinecone_connectivity():
        print("\n❌ NETWORK ERROR: Cannot connect to Pinecone API (api.pinecone.io)")
        print("Troubleshooting steps:")
        print("1. Check internet connection: ping google.com")
        print("2. Test DNS: nslookup api.pinecone.io")
        print("3. Check /etc/resolv.conf (DNS servers)")
        print("4. Disable VPN/firewall temporarily")
        print("5. Restart networking: sudo systemctl restart systemd-resolved")
        print("\n💡 Use --offline flag to validate files without uploading.")
        sys.exit(1)
    
    api_key = os.getenv("PINECONE_API_KEY")
    index_name = os.getenv("PINECONE_INDEX_NAME")
    if not api_key:
        print("❌ Missing PINECONE_API_KEY in .env")
        sys.exit(1)
    if not index_name:
        print("❌ Missing PINECONE_INDEX_NAME in .env")
        sys.exit(1)
    
    pc = Pinecone(api_key=api_key)
    index = pc.Index(index_name)

JSON_PATH       = "./knowledge_base/dictionary.json"
BHUTIA_JSON_PATH = "./knowledge_base/Bhutia.json"
BHUTIA_TXT_PATH = "./bhutia_full_question_bank.txt"
BATCH_SIZE      = 50

LANGUAGES = {
    # "Lepcha": "lepcha",
    # "Limbu":  "limbu",
    # "Magar":  "magar",
    # "Rai":    "rai",
    "Bhutia": "bhutia",
}

def get_embedding(text: str) -> list:
    response = client.embeddings.create(
        input=[text],
        model="openai/text-embedding-3-small",
        dimensions=384,
    )
    return response.data[0].embedding

def upsert_batch(vectors: list):
    if vectors:
        if index:
            index.upsert(vectors=vectors)
        else:
            print(f"  [OFFLINE] Would upload batch of {len(vectors)} vectors")
        time.sleep(0.3)

def sync_data():
    if not index:
        print("✅ Local files validated. Exiting offline mode.")
        return
    
    print("Deleting all existing Pinecone vectors...")
    try:
        index.delete(delete_all=True)
    except Exception:
        pass  # index already empty, skip
    time.sleep(2)
    print("Index cleared.\n")

    vectors = []
    seen    = set()

    # ── JSON dictionary (Lepcha, Limbu, Magar, Rai) ──────────────────────────
    if not os.path.exists(JSON_PATH):
        print(f"WARNING: {JSON_PATH} not found — skipping JSON languages.")
    else:
        print(f"Processing {JSON_PATH}...")
        with open(JSON_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)

        for entry in data:
            english = entry.get("english", "").strip()
            if not english:
                continue

            for lang_name, lang_key in LANGUAGES.items():
                native = entry.get(lang_key, "").strip()
                trans  = entry.get(f"transliteration_{lang_key}", "").strip()
                trans_alt = entry.get("transliteration_bhutia" if lang_name == "Bhutia" else f"transliteration_{lang_key}", "").strip()

                if not native and not trans and not trans_alt:
                    continue

                text_content = (
                    f"English: {english} | "
                    f"{lang_name}: {native or trans_alt} | "
                    f"Transliteration: {trans or trans_alt}"
                )

                if text_content in seen:
                    continue
                seen.add(text_content)

                vectors.append({
                    "id":     str(uuid.uuid4()),
                    "values": get_embedding(text_content),
                    "metadata": {
                        "text":     text_content,
                        "language": lang_name,
                        "english":  english,
                        "native":   native,
                        "transliteration": trans,
                    },
                })

                if len(vectors) >= BATCH_SIZE:
                    upsert_batch(vectors)
                    print(f"  Uploaded batch of {BATCH_SIZE}...")
                    vectors = []

        upsert_batch(vectors)
        vectors = []
        print("JSON dictionary uploaded.\n")

# ── Additional Bhutia TXT files ──────────────────────────────────────────
    additional_bhuties = [
        "./clean_bhutia_conversations.txt",
        "./clean_bhutia_data.txt", 
        "./bhutia_conversations.txt",
        "./bhutia_dictionary.txt",
        "./final_bhutia_conversations.txt",
        "./separated_bhutia_mcqs.txt"
        "./food_conversations.txt"
        "./bhutia_MASTER_VECTOR_DATA.txt"
        
    
    ]
    
    for txt_path in additional_bhuties:
        if os.path.exists(txt_path):
            print(f"Processing additional Bhutia: {txt_path}...")
            with open(txt_path, "r", encoding="utf-8") as f:
                lines = f.readlines()
            
            for line in lines:
                line = line.strip()
                if len(line) < 3 or line in seen:
                    continue
                seen.add(line)
                
                vectors.append({
                    "id": str(uuid.uuid4()),
                    "values": get_embedding(line),
                    "metadata": {
                        "text": line,
                        "language": "Bhutia",
                        "source": os.path.basename(txt_path)
                    },
                })
                
                if len(vectors) >= BATCH_SIZE:
                    upsert_batch(vectors)
                    print(f"  Uploaded {BATCH_SIZE} from {os.path.basename(txt_path)}")
                    vectors = []
            
            upsert_batch(vectors)
            print(f"✓ Completed {txt_path}\n")
    
    # ── Original Bhutia TXT ───────────────────────────────────────────────────
    if not os.path.exists(BHUTIA_TXT_PATH):
        print(f"WARNING: {BHUTIA_TXT_PATH} not found.")
    else:
        print("Processing original Bhutia text file...")
        with open(BHUTIA_TXT_PATH, "r", encoding="utf-8") as f:
            lines = f.readlines()

        for line in lines:
            line = line.strip()
            if len(line) < 5 or line in seen:
                continue
            seen.add(line)

            vectors.append({
                "id":     str(uuid.uuid4()),
                "values": get_embedding(line),
                "metadata": {
                    "text":     line,
                    "language": "Bhutia",
                },
            })

            if len(vectors) >= BATCH_SIZE:
                upsert_batch(vectors)
                print(f"  Uploaded batch of {BATCH_SIZE} Bhutia vectors...")
                vectors = []

        upsert_batch(vectors)
        print("Bhutia data uploaded.\n")

    print("All languages synced successfully!")
    print("Run: python3 search_pinecone.py 'hello' 'Bhutia'  to verify.")

if __name__ == "__main__":
    sync_data()