# Legacy Source Files (Pre-Beast Engine)

These are the original Streamlit-based recommendation scripts from the DATA 606 capstone project. They use sklearn NearestNeighbors with pickle files and are **not** part of the current Beast Engine architecture.

**For the active codebase, see:**
- `../backend/` - FastAPI + ChromaDB + ResNet152 (Beast Engine)
- `../frontend/` - Next.js UI

## Files

| File | Description |
|------|-------------|
| `ImageBasedRecom.py` | Streamlit image-based recommender (ResNet152 + pickle embeddings) |
| `TextBasedRecom.py` | Streamlit text-based recommender (TF-IDF + SVD + k-NN) |
| `MergedRecom.py` | Combined image + text Streamlit recommender |
| `datascraper.py` | Data scraping utilities |
| `mpdel_trainer.py` | Model training script |
| `initial_eda.ipynb` | Exploratory data analysis notebook |
