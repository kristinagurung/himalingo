import chromadb
from sentence_transformers import SentenceTransformer

# 1. Connect to the running server (make sure 'chroma run' is still on!)
client = chromadb.HttpClient(host='localhost', port=8000)

# 2. Delete the old one if it exists to avoid confusion
try:
    client.delete_collection("himalingo_dictionary")
    print("Old collection deleted.")
except:
    pass

# 3. Create fresh
collection = client.create_collection(name="himalingo_dictionary")
model = SentenceTransformer('all-MiniLM-L6-v2')

# 4. Add data carefully
# Use a simple format: "English: [word] | Bhutia: [word]"
data = [
    "English: Hello | Bhutia: Kuzu-zangpo",
    "English: Water | Bhutia: Chhu",
    "English: Thank you | Bhutia: Kadrinche"
]

# We need IDs for every item
ids = ["id1", "id2", "id3"]

# Generate vectors
embeddings = model.encode(data).tolist()

# Add to DB
collection.add(
    ids=ids,
    embeddings=embeddings,
    documents=data
)

print(f"✅ SUCCESS! Added {collection.count()} items.")