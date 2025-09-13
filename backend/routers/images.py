from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from database import get_db, Image

router = APIRouter()


@router.get("/")
async def list_images(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    total = db.query(Image).count()
    offset = (page - 1) * page_size
    rows = (
        db.query(Image)
        .order_by(Image.uploaded_at.desc())
        .offset(offset)
        .limit(page_size)
        .all()
    )
    items = [
        {
            "id": r.id,
            "filename": r.filename,
            "caption": r.caption,
            "s3_url": r.s3_url,
            "uploaded_at": r.uploaded_at.isoformat() if r.uploaded_at else None,
        }
        for r in rows
    ]
    return {
        "items": items,
        "page": page,
        "page_size": page_size,
        "total": total,
    }

