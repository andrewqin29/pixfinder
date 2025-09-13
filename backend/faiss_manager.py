import faiss
import numpy as np
import pickle
import os
import logging
from typing import List, Tuple, Optional

from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

class FAISSManager:
    """Manages FAISS vector index for semantic image search"""

    def __init__(
        self,
        embedding_dim: int = 512,
        index_path: str = "./faiss_index.index",
        s3_key: Optional[str] = None,
    ):
        self.embedding_dim = embedding_dim  # CLIP ViT-B-32 uses 512 dimensions
        self.index_path = index_path
        self.index = None
        self.image_ids = []  # Maps FAISS index positions to database IDs
        self.s3_key = s3_key or os.getenv("S3_FAISS_KEY")
        
    def initialize_index(self):
        """Create a new FAISS index or load existing one"""
        try:
            if os.path.exists(self.index_path):
                self.load_index()
                logger.info(f"Loaded existing FAISS index with {self.index.ntotal} vectors")
            else:
                # Try load from S3 if configured
                if self.s3_key:
                    try:
                        from . import s3_manager  # relative import if used as package
                    except Exception:
                        import s3_manager  # fallback for module path
                    if s3_manager.is_configured() and s3_manager.object_exists(self.s3_key):
                        mapping_path = self.index_path + ".mapping"
                        s3_manager.download_file(self.s3_key, self.index_path)
                        s3_manager.download_file(self.s3_key + ".mapping", mapping_path)
                        if os.path.exists(self.index_path):
                            self.load_index()
                            logger.info(
                                f"Downloaded FAISS index from S3 and loaded with {self.index.ntotal} vectors"
                            )
                            return True
                # Create new IndexFlatIP (Inner Product for cosine similarity)
                self.index = faiss.IndexFlatIP(self.embedding_dim)
                self.image_ids = []
                logger.info("Created new FAISS IndexFlatIP")
                
            return True
            
        except Exception as e:
            logger.error(f"Failed to initialize FAISS index: {e}")
            return False
    
    def add_embedding(self, embedding: np.ndarray, image_id: int):
        """Add a single image embedding to the index"""
        if self.index is None:
            logger.error("FAISS index not initialized")
            return False
            
        try:
            # Normalize embedding for cosine similarity
            embedding = embedding.reshape(1, -1).astype('float32')
            faiss.normalize_L2(embedding)
            
            # Add to index
            self.index.add(embedding)
            self.image_ids.append(image_id)
            
            logger.debug(f"Added embedding for image_id {image_id}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to add embedding for image_id {image_id}: {e}")
            return False
    
    def search(self, query_embedding: np.ndarray, top_k: int = 5) -> List[Tuple[int, float]]:
        """Search for most similar images"""
        if self.index is None:
            logger.error("FAISS index not initialized")
            return []
            
        try:
            # Normalize query embedding
            query_embedding = query_embedding.reshape(1, -1).astype('float32')
            faiss.normalize_L2(query_embedding)
            
            # Search index
            scores, indices = self.index.search(query_embedding, top_k)
            
            # Map FAISS indices back to database IDs
            results = []
            for i, (score, idx) in enumerate(zip(scores[0], indices[0])):
                if idx < len(self.image_ids):  # Valid index
                    image_id = self.image_ids[idx]
                    results.append((image_id, float(score)))
            
            return results
            
        except Exception as e:
            logger.error(f"FAISS search failed: {e}")
            return []
    
    def save_index(self):
        """Save FAISS index and ID mapping to disk"""
        if self.index is None:
            return False
            
        try:
            # Save FAISS index
            faiss.write_index(self.index, self.index_path)
            
            # Save ID mapping
            mapping_path = self.index_path + ".mapping"
            with open(mapping_path, 'wb') as f:
                pickle.dump(self.image_ids, f)
                
            logger.info(f"Saved FAISS index with {len(self.image_ids)} vectors")

            # Optionally push to S3
            if self.s3_key:
                try:
                    try:
                        from . import s3_manager
                    except Exception:
                        import s3_manager
                    if s3_manager.is_configured():
                        s3_manager.upload_file(self.s3_key, self.index_path, public=False)
                        s3_manager.upload_file(self.s3_key + ".mapping", mapping_path, public=False)
                        logger.info("Uploaded FAISS index to S3")
                except Exception as e:
                    logger.warning(f"Failed to upload FAISS index to S3: {e}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to save FAISS index: {e}")
            return False
    
    def load_index(self):
        """Load FAISS index and ID mapping from disk"""
        try:
            # Load FAISS index
            self.index = faiss.read_index(self.index_path)
            
            # Load ID mapping
            mapping_path = self.index_path + ".mapping"
            if os.path.exists(mapping_path):
                with open(mapping_path, 'rb') as f:
                    self.image_ids = pickle.load(f)
            else:
                self.image_ids = []
                
            return True
            
        except Exception as e:
            logger.error(f"Failed to load FAISS index: {e}")
            return False 
