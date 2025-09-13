from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Request
from sqlalchemy.orm import Session
from typing import List
from database import get_db, Image
from routers.auth import verify_admin_session
from ml_models import generate_image_embedding, generate_image_caption
import os
import logging
from datetime import datetime
from uuid import uuid4

try:
    from .. import s3_manager  # package relative
except Exception:
    import s3_manager  # module fallback

logger = logging.getLogger(__name__)

# Create router
router = APIRouter()

# Allowed image types
ALLOWED_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif'}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB


def validate_image_file(file: UploadFile) -> bool:
    """Validate uploaded image file"""
    # Check file extension
    file_ext = os.path.splitext(file.filename.lower())[1]
    if file_ext not in ALLOWED_EXTENSIONS:
        return False
    
    # Check file size (approximate, since we haven't read it yet)
    if hasattr(file, 'size') and file.size > MAX_FILE_SIZE:
        return False
    
    return True


@router.post("/single")
async def upload_single_image(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    _: bool = Depends(verify_admin_session)
):
    """Upload a single image (admin only)"""
    from main import faiss_manager
    
    # Validate file
    if not validate_image_file(file):
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file. Allowed: {', '.join(ALLOWED_EXTENSIONS)}, Max size: 10MB"
        )
    
    try:
        # Read uploaded bytes
        content = await file.read()
        if len(content) > MAX_FILE_SIZE:
            return {
                "filename": file.filename,
                "success": False,
                "error": "File too large (max 10MB)"
            }

        # Decide storage target: S3 if configured, else local
        file_ext = os.path.splitext(file.filename)[1].lower()
        content_type = {
            ".jpg": "image/jpeg",
            ".jpeg": "image/jpeg",
            ".png": "image/png",
            ".webp": "image/webp",
            ".heic": "image/heic",
            ".heif": "image/heif",
        }.get(file_ext, "application/octet-stream")

        stored_path = None
        if s3_manager.is_configured():
            key = f"images/{datetime.utcnow().strftime('%Y/%m/%d')}/{uuid4().hex}{file_ext}"
            url = s3_manager.upload_bytes(key, content, content_type=content_type, public=True)
            if not url:
                raise RuntimeError("S3 upload failed")
            stored_path = url

            # For embedding/caption generation, save to a temp local file
            upload_dir = "/app/uploads" if os.path.exists("/app") else "./uploads"
            os.makedirs(upload_dir, exist_ok=True)
            file_path = os.path.join(upload_dir, f"tmp-{uuid4().hex}{file_ext}")
            with open(file_path, "wb") as f:
                f.write(content)
        else:
            upload_dir = "/app/uploads" if os.path.exists("/app") else "./uploads"
            os.makedirs(upload_dir, exist_ok=True)
            file_path = os.path.join(upload_dir, file.filename)
            with open(file_path, "wb") as f:
                f.write(content)
            stored_path = file_path

        # Generate AI content
        embedding = generate_image_embedding(file_path)
        caption = generate_image_caption(file_path)
        
        # Check for AI failures
        if embedding is None:
            return {
                "filename": file.filename,
                "success": False,
                "error": "CLIP failed to process image"
            }
        
        if caption is None:
            caption = "Caption generation failed"
        
        # Save to database
        db_image = Image(
            filename=file.filename,
            s3_url=stored_path,
            caption=caption,
            uploaded_at=datetime.utcnow()
        )
        db.add(db_image)
        db.commit()
        db.refresh(db_image)
        
        # Add to FAISS index
        faiss_success = faiss_manager.add_embedding(embedding, db_image.id)
        if faiss_success:
            faiss_manager.save_index()
        
        return {
            "filename": file.filename,
            "success": True,
            "id": db_image.id,
            "caption": caption
        }
        
    except Exception as e:
        logger.error(f"Upload failed for {file.filename}: {e}")
        # Clean up file if it was created
        if 'file_path' in locals() and os.path.exists(file_path):
            try:
                os.remove(file_path)
            except Exception:
                pass
        
        return {
            "filename": file.filename,
            "success": False,
            "error": "Upload processing failed"
        } 
