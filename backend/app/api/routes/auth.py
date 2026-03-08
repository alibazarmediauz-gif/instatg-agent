"""
InstaTG Agent — Auth API Routes

Local JWT authentication endpoints with PostgreSQL.
"""

import structlog
from typing import Optional
from datetime import datetime, timedelta

from fastapi import APIRouter, HTTPException, Depends, Header
from pydantic import BaseModel, EmailStr

from app.database import async_session_factory, get_db
from app.models import Tenant
from app.config import settings
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

import jwt
from passlib.context import CryptContext

logger = structlog.get_logger(__name__)
router = APIRouter(prefix="/api/auth", tags=["Authentication"])

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT configuration
SECRET_KEY = settings.secret_key
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 1 day
REFRESH_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

class SignUpRequest(BaseModel):
    email: EmailStr
    password: str
    business_name: str

class SignInRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    user_id: str
    email: str

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire, "type": "access"})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def create_refresh_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=REFRESH_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire, "type": "refresh"})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def verify_jwt(authorization: Optional[str] = Header(None)) -> dict:
    """Verify local JWT token from Authorization header."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid authorization header")

    token = authorization.split(" ")[1]

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
            
        return {
            "user_id": payload.get("sub"),
            "email": payload.get("email"),
            "role": "authenticated",
        }
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_tenant(
    user: dict = Depends(verify_jwt),
    db: AsyncSession = Depends(get_db)
) -> Tenant:
    """
    Dependency to get the current tenant based on the authenticated user's email.
    """
    email = user.get("email")
    if not email:
        raise HTTPException(status_code=401, detail="Invalid user data in token")

    result = await db.execute(select(Tenant).where(Tenant.owner_email == email))
    tenant = result.scalar_one_or_none()

    if not tenant:
        logger.warning("tenant_not_found_for_user", email=email)
        raise HTTPException(status_code=403, detail="No tenant associated with this account")

    return tenant

@router.post("/signup", response_model=TokenResponse)
async def sign_up(data: SignUpRequest, db: AsyncSession = Depends(get_db)):
    """Register a new user directly in PostgreSQL."""
    try:
        # Check if email exists
        result = await db.execute(select(Tenant).where(Tenant.owner_email == data.email))
        if result.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="User with this email already exists")

        # Create tenant record with hashed password
        hashed_password = get_password_hash(data.password)
        tenant = Tenant(
            name=data.business_name,
            owner_email=data.email,
            hashed_password=hashed_password
        )
        db.add(tenant)
        await db.commit()
        await db.refresh(tenant)

        # Generate tokens
        token_data = {"sub": str(tenant.id), "email": tenant.owner_email}
        access_token = create_access_token(token_data)
        refresh_token = create_refresh_token(token_data)

        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            user_id=str(tenant.id),
            email=tenant.owner_email,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error("signup_error", error=str(e))
        raise HTTPException(status_code=500, detail="Registration failed")

@router.post("/signin", response_model=TokenResponse)
async def sign_in(data: SignInRequest, db: AsyncSession = Depends(get_db)):
    """Sign in using local PostgreSQL."""
    try:
        # Find tenant by email
        result = await db.execute(select(Tenant).where(Tenant.owner_email == data.email))
        tenant = result.scalar_one_or_none()
        
        if not tenant or not tenant.hashed_password:
            raise HTTPException(status_code=401, detail="Invalid email or password")
            
        # Verify password
        if not verify_password(data.password, tenant.hashed_password):
            raise HTTPException(status_code=401, detail="Invalid email or password")

        # Generate tokens
        token_data = {"sub": str(tenant.id), "email": tenant.owner_email}
        access_token = create_access_token(token_data)
        refresh_token = create_refresh_token(token_data)

        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            user_id=str(tenant.id),
            email=tenant.owner_email,
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error("signin_error", error=str(e))
        raise HTTPException(status_code=500, detail="Authentication failed")

@router.post("/refresh")
async def refresh_token(refresh_token: str):
    """Refresh access token using refresh token."""
    try:
        payload = jwt.decode(refresh_token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")
            
        token_data = {"sub": payload.get("sub"), "email": payload.get("email")}
        new_access_token = create_access_token(token_data)
        new_refresh_token = create_refresh_token(token_data)
        
        return {
            "access_token": new_access_token,
            "refresh_token": new_refresh_token,
        }
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Refresh token has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

@router.get("/me")
async def get_current_user(user: dict = Depends(verify_jwt)):
    """Get current authenticated user info."""
    return user
