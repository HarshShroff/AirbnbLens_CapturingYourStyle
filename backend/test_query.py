import chromadb

client = chromadb.PersistentClient(
    path="./chroma_db", settings=chromadb.Settings(anonymized_telemetry=False)
)
collection = client.get_collection(name="airbnb_metadata")
try:
    results = collection.query(query_texts=["Cozy cottage"], n_results=1)
    print("Test successful:", results)
except Exception as e:
    import traceback

    traceback.print_exc()
    print("Test failed:", str(e))
