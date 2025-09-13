from fastapi import APIRouter, HTTPException, Depends, status, Response, Request
from pydantic import BaseModel
import bcrypt
import secrets
import os
from typing import Optional
import logging
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

# Create router
router = APIRouter()

# Environment variables
ADMIN_USERNAME = os.getenv("ADMIN_USERNAME", "admin")
ADMIN_PASSWORD_HASH = os.getenv("ADMIN_PASSWORD_HASH", "")

# Simple in-memory session storage (for single admin user)
active_sessions = {}  # {session_id: expiry_time}


class LoginRequest(BaseModel):
    username: str
    password: str


class LoginResponse(BaseModel):
    message: str
    logged_in: bool


@router.post("/login", response_model=LoginResponse)
async def login(request: LoginRequest, response: Response):
    """Simple admin login with session cookie"""
    
    # Validate username
    if request.username != ADMIN_USERNAME:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
    
    # Validate password with bcrypt
    if not ADMIN_PASSWORD_HASH:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Admin password not configured"
        )
    
    try:
        password_valid = bcrypt.checkpw(
            request.password.encode('utf-8'),
            ADMIN_PASSWORD_HASH.encode('utf-8')
        )
    except Exception as e:
        logger.error(f"Password validation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Authentication error"
        )
    
    if not password_valid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
    
    # Create session ID and store it
    session_id = secrets.token_urlsafe(32)
    expiry = datetime.utcnow() + timedelta(hours=24)
    active_sessions[session_id] = expiry
    
    # Set secure cookie
    response.set_cookie(
        key="admin_session",
        value=session_id,
        max_age=24 * 60 * 60,  # 24 hours in seconds
        httponly=True,  # Prevents JavaScript access
        secure=False,  # Set to True in production with HTTPS
        samesite="lax"
    )
    
    return LoginResponse(
        message="Login successful",
        logged_in=True
    )


def verify_admin_session(request: Request):
    """Dependency to verify admin session from cookie"""
    session_id = request.cookies.get("admin_session")
    
    if not session_id or session_id not in active_sessions:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )
    
    # Check if session expired
    if datetime.utcnow() > active_sessions[session_id]:
        del active_sessions[session_id]
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired"
        )
    
    return True  # Session is valid


@router.post("/logout")
async def logout(request: Request, response: Response):
    """Logout and clear session"""
    session_id = request.cookies.get("admin_session")
    
    if session_id and session_id in active_sessions:
        del active_sessions[session_id]
    
    response.delete_cookie("admin_session")
    return {"message": "Logged out successfully"} 


@router.get("/status")
async def status_check(request: Request):
    """Return whether an admin session is active"""
    session_id = request.cookies.get("admin_session")
    valid = False
    if session_id and session_id in active_sessions:
        if datetime.utcnow() <= active_sessions[session_id]:
            valid = True
        else:
            # expire if stale
            del active_sessions[session_id]
            valid = False
    return {"logged_in": valid}
