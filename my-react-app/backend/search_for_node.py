import chromadb
from sentence_transformers import SentenceTransformer

# Connect to the server you have running in the other terminal
client = chromadb.HttpClient(host='127.0.0.1', port=8000)

# Create (or get) the collection
collection = client.get_or_create_collection(name="himalingo_dictionary")
model = SentenceTransformer('all-MiniLM-L6-v2')

# The data you want to "teach" the AI
# Add as many as you like!
dictionary_data = [
    "English: Hello | Bhutia: Kuzu-zangpo | Lepcha: Khāmu-rimu",
    "English: Water | Bhutia: Chhu | Lepcha: A-yong",
    "English: Thank you | Bhutia: Kadrinche | Lepcha: Āryūng-chū",
    "English: Food | Bhutia: Za | Lepcha: Zo"
]

# Create simple IDs
ids = [f"id_{i}" for i in range(len(dictionary_data))]

# Convert text to vectors
print("Converting words to vectors... please wait...")
embeddings = model.encode(dictionary_data).tolist()

# Add to the database
collection.add(
    ids=ids,
    embeddings=embeddings,
    documents=dictionary_data
)

print(f"✅ Successfully added {len(dictionary_data)} phrases to ChromaDB!")