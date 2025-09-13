import os
import logging
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from database import init_db
from routers import search, auth, upload
from routers import images as images_router
from ml_models import load_models, clip_model, blip_model
from faiss_manager import FAISSManager
from dotenv import load_dotenv

# Load env for local dev
load_dotenv()

# Create the FastAPI application instance
app = FastAPI(
    title="PixFinder API",
    description="Semantic photo library with natural language search",
    version="1.0.0",
)

# Configure CORS (Cross-Origin Resource Sharing)
# Allows React frontend to talk to the FastAPI backend
# Logging
log_level = os.getenv("LOG_LEVEL", "INFO").upper()
logging.basicConfig(level=getattr(logging, log_level, logging.INFO))

# Configure CORS (Cross-Origin Resource Sharing)
frontend_origins = os.getenv("FRONTEND_URL", "http://localhost:5173").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in frontend_origins if o.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global instances
faiss_index_path = os.getenv("FAISS_INDEX_PATH")
if not faiss_index_path:
    data_dir = "/app/data" if os.path.exists("/app") else "./data"
    os.makedirs(data_dir, exist_ok=True)
    faiss_index_path = os.path.join(data_dir, "faiss_index.index")
faiss_manager = FAISSManager(index_path=faiss_index_path, s3_key=os.getenv("S3_FAISS_KEY"))

# Serve local uploads for development/testing
uploads_dir = "/app/uploads" if os.path.exists("/app") else "./uploads"
os.makedirs(uploads_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")

# Include routers
app.include_router(auth.router, prefix="/auth", tags=["authentication"])
app.include_router(search.router, prefix="/search", tags=["search"])
app.include_router(upload.router, prefix="/upload", tags=["upload"])
app.include_router(images_router.router, prefix="/images", tags=["images"]) 


@app.on_event("startup")
async def startup_event():
    """This runs when the FastAPI app starts up"""
    # Initialize database
    await init_db()
    
    # Load ML models
    models_loaded = load_models()
    if not models_loaded:
        print("WARNING: ML models failed to load!")
    
    # Initialize FAISS index
    faiss_initialized = faiss_manager.initialize_index()
    if not faiss_initialized:
        print("WARNING: FAISS index failed to initialize!")
    
    print("PixFinder API started successfully!")


@app.get("/")
async def root():
    """Basic health check - returns when API is running"""
    return {"message": "PixFinder API is running", "status": "healthy"}


@app.get("/health")
async def health_check():
    """More detailed health check endpoint"""
    # naive status flags
    db_status = "connected"  # tables are created on startup; deeper checks optional
    models_status = {
        "clip": clip_model is not None,
        "blip": blip_model is not None,
    }
    faiss_status = {
        "initialized": faiss_manager.index is not None,
        "ntotal": int(faiss_manager.index.ntotal) if faiss_manager.index is not None else 0,
        "path": faiss_manager.index_path,
    }
    return {
        "status": "healthy",
        "database": db_status,
        "models": models_status,
        "faiss": faiss_status,
        "version": "1.0.0",
    }
