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

def _max_file_size_bytes() -> int:
    #10 mb max file upload size, first read from env and default if not found
    try:
        mb = int(os.getenv("MAX_FILE_SIZE_MB", "10"))
    except ValueError:
        mb = 10
    return mb * 1024 * 1024


def validate_image_file(file: UploadFile) -> bool:
    """Validate uploaded image file"""
    # Check file extension
    file_ext = os.path.splitext(file.filename.lower())[1]
    if file_ext not in ALLOWED_EXTENSIONS:
        return False
    
    # Check file size (approximate, since we haven't read it yet)
    if hasattr(file, 'size') and file.size > _max_file_size_bytes():
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
        if len(content) > _max_file_size_bytes():
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
        temp_local_path = None
        if s3_manager.is_configured():
            key = f"images/{datetime.utcnow().strftime('%Y/%m/%d')}/{uuid4().hex}{file_ext}"
            url = s3_manager.upload_bytes(key, content, content_type=content_type, public=True)
            if not url:
                raise RuntimeError("S3 upload failed")
            stored_path = url

            # For embedding/caption generation, save to a temp local file
            upload_dir = "/app/uploads" if os.path.exists("/app") else "./uploads"
            os.makedirs(upload_dir, exist_ok=True)
            temp_local_path = os.path.join(upload_dir, f"tmp-{uuid4().hex}{file_ext}")
            with open(temp_local_path, "wb") as f:
                f.write(content)
        else:
            upload_dir = "/app/uploads" if os.path.exists("/app") else "./uploads"
            os.makedirs(upload_dir, exist_ok=True)
            unique_name = f"{uuid4().hex}{file_ext}"
            file_path = os.path.join(upload_dir, unique_name)
            with open(file_path, "wb") as f:
                f.write(content)
            # Public URL for locally stored files
            stored_path = f"/uploads/{unique_name}"

        # Generate AI content
        # Choose path to process: temp local for S3, else saved local path
        process_path = temp_local_path if temp_local_path else file_path
        embedding = generate_image_embedding(process_path)
        caption = generate_image_caption(process_path)
        
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
        
        result = {
            "filename": file.filename,
            "success": True,
            "id": db_image.id,
            "caption": caption
        }
        # Clean up temp file if used
        if temp_local_path and os.path.exists(temp_local_path):
            try:
                os.remove(temp_local_path)
            except Exception:
                pass
        return result
        
    except Exception as e:
        logger.error(f"Upload failed for {file.filename}: {e}")
        # Clean up file if it was created
        if 'temp_local_path' in locals() and temp_local_path and os.path.exists(temp_local_path):
            try:
                os.remove(temp_local_path)
            except Exception:
                pass
        
        return {
            "filename": file.filename,
            "success": False,
            "error": "Upload processing failed"
        } 
