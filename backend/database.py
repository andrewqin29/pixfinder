from sqlalchemy import create_engine, Column, Integer, String, DateTime
from sqlalchemy.orm import declarative_base, sessionmaker
from datetime import datetime
import os
from typing import Optional

from dotenv import load_dotenv

"""Database setup and helpers"""

# Load environment variables (useful for local dev outside Docker)
load_dotenv()

Base = declarative_base()


def _resolve_sqlite_url() -> str:
    """Resolve a stable SQLite file path under data directory."""
    data_dir = "/app/data" if os.path.exists("/app") else "./data"
    os.makedirs(data_dir, exist_ok=True)
    db_path = os.path.join(data_dir, "pique.db")
    return f"sqlite:///{db_path}"


def _get_database_url() -> str:
    env_url = os.getenv("DATABASE_URL")
    if env_url:
        return env_url
    return _resolve_sqlite_url()


# Create engine/session using env or sensible SQLite default
DATABASE_URL = _get_database_url()
is_sqlite = DATABASE_URL.startswith("sqlite:")
connect_args = {"check_same_thread": False} if is_sqlite else {}
engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Image(Base):
    """Image metadata model"""
    __tablename__ = "images"
    
    id = Column(Integer, primary_key=True, index=True)
    s3_url = Column(String, nullable=False)
    caption = Column(String, nullable=True)
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    filename = Column(String, nullable=False)


def get_db():
    """Database dependency for FastAPI"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


async def init_db():
    """Initialize database tables"""
    Base.metadata.create_all(bind=engine)
    print("Database initialized successfully")


def get_db_path():
    """Get the database file path"""
    data_dir = "/app/data" if os.path.exists("/app") else "./data"
    os.makedirs(data_dir, exist_ok=True)
    return os.path.join(data_dir, "pique.db")
