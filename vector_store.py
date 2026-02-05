import faiss
import numpy as np
import pickle
import os
from sentence_transformers import SentenceTransformer

class VectorStore:
    def __init__(self, model_name='all-MiniLM-L6-v2'):
        self.model = SentenceTransformer(model_name)
        self.index = None
        self.documents = []
        self.metadata = []
        self.dimension = 384  # For MiniLM-L6-v2
        
    def build_index(self, documents: List[str], metadata: List[Dict] = None):
        """Create FAISS index from documents"""
        self.documents = documents
        self.metadata = metadata or []
        
        # Generate embeddings
        print("Generating embeddings...")
        embeddings = self.model.encode(documents, show_progress_bar=True)
        
        # Create FAISS index
        self.index = faiss.IndexFlatL2(self.dimension)
        self.index.add(embeddings.astype('float32'))
        print(f"Index built with {len(documents)} documents")
        
    def search(self, query: str, k: int = 5):
        """Search for similar documents"""
        if self.index is None:
            raise ValueError("Index not built. Call build_index() first.")
        
        # Encode query
        query_embedding = self.model.encode([query])
        
        # Search
        distances, indices = self.index.search(query_embedding.astype('float32'), k)
        
        # Get results
        results = []
        for idx, distance in zip(indices[0], distances[0]):
            if idx < len(self.documents):
                results.append({
                    "content": self.documents[idx],
                    "metadata": self.metadata[idx] if idx < len(self.metadata) else {},
                    "score": float(distance)
                })
        
        return results
    
    def save(self, path: str):
        """Save vector store to disk"""
        os.makedirs(os.path.dirname(path), exist_ok=True)
        
        # Save FAISS index
        faiss.write_index(self.index, f"{path}.index")
        
        # Save documents and metadata
        with open(f"{path}_data.pkl", "wb") as f:
            pickle.dump({
                "documents": self.documents,
                "metadata": self.metadata
            }, f)
    
    def load(self, path: str):
        """Load vector store from disk"""
        # Load FAISS index
        self.index = faiss.read_index(f"{path}.index")
        
        # Load documents and metadata
        with open(f"{path}_data.pkl", "rb") as f:
            data = pickle.load(f)
            self.documents = data["documents"]
            self.metadata = data["metadata"]