from fastapi import APIRouter, Query, Depends
from sqlalchemy.orm import Session
from typing import Optional, List
from database import get_db, Image
from ml_models import generate_text_embedding
import logging

logger = logging.getLogger(__name__)

# Create a router for search-related endpoints
router = APIRouter()


@router.get("/")
async def search_images(
    q: str = Query(..., description="Search query"),
    db: Session = Depends(get_db)
):
    """
    Search for images using natural language
    
    - **q**: The search query (e.g., "sunset over mountains")
    """
    from main import faiss_manager
    
    try:
        # Generate embedding for search query
        query_embedding = generate_text_embedding(q)
        if query_embedding is None:
            return {
                "query": q,
                "results": [],
                "error": "Failed to process search query"
            }
        
        # Search FAISS index for similar images
        search_results = faiss_manager.search(query_embedding, top_k=5)
        
        if not search_results:
            return {
                "query": q,
                "results": [],
                "message": "No images found. Try uploading some images first!"
            }
        
        # Get image metadata from database
        results = []
        for image_id, similarity_score in search_results:
            image = db.query(Image).filter(Image.id == image_id).first()
            if image:
                results.append({
                    "id": image.id,
                    "filename": image.filename,
                    "caption": image.caption,
                    "s3_url": image.s3_url,
                    "uploaded_at": image.uploaded_at.isoformat(),
                    "similarity_score": round(similarity_score, 3)
                })
        
        return {
            "query": q,
            "results": results,
            "count": len(results)
        }
        
    except Exception as e:
        logger.error(f"Search failed for query '{q}': {e}")
        return {
            "query": q,
            "results": [],
            "error": "Search temporarily unavailable"
        }


@router.get("/similar/{image_id}")
async def find_similar_images(image_id: int):
    """Find images similar to a specific image"""
    # TODO: Implement similarity search
    return {
        "image_id": image_id,
        "similar_images": [],
        "message": "Similar image search coming soon!"
    } 