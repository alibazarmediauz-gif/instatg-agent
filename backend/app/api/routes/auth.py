"""
InstaTG Agent — Auth API Routes

Supabase-based JWT authentication endpoints.
"""

import structlog
from typing import Optional

from fastapi import APIRouter, HTTPException, Depends, Header
from pydantic import BaseModel, EmailStr
import httpx

from app.config import settings

logger = structlog.get_logger(__name__)
router = APIRouter(prefix="/api/auth", tags=["Authentication"])


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


async def verify_jwt(authorization: Optional[str] = Header(None)) -> dict:
    """Verify Supabase JWT token from Authorization header."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid authorization header")

    token = authorization.split(" ")[1]

    try:
        async with httpx.AsyncClient() as http:
            response = await http.get(
                f"{settings.supabase_url}/auth/v1/user",
                headers={
                    "Authorization": f"Bearer {token}",
                    "apikey": settings.supabase_anon_key,
                },
                timeout=10,
            )

            if response.status_code == 200:
                user_data = response.json()
                return {
                    "user_id": user_data.get("id"),
                    "email": user_data.get("email"),
                    "role": user_data.get("role", "authenticated"),
                }
            else:
                raise HTTPException(status_code=401, detail="Invalid or expired token")

    except httpx.RequestError as e:
        logger.error("auth_verification_error", error=str(e))
        raise HTTPException(status_code=503, detail="Authentication service unavailable")


@router.post("/signup", response_model=TokenResponse)
async def sign_up(data: SignUpRequest):
    """Register a new user via Supabase."""
    try:
        async with httpx.AsyncClient() as http:
            response = await http.post(
                f"{settings.supabase_url}/auth/v1/signup",
                json={
                    "email": data.email,
                    "password": data.password,
                    "data": {"business_name": data.business_name},
                },
                headers={
                    "apikey": settings.supabase_anon_key,
                    "Content-Type": "application/json",
                },
                timeout=15,
            )

            if response.status_code in (200, 201):
                result = response.json()
                session = result.get("session", {})
                user = result.get("user", {})

                # Create tenant record in our DB
                from app.database import async_session_factory
                from app.models import Tenant

                async with async_session_factory() as db:
                    tenant = Tenant(
                        name=data.business_name,
                        owner_email=data.email,
                    )
                    db.add(tenant)
                    await db.commit()

                return TokenResponse(
                    access_token=session.get("access_token", ""),
                    refresh_token=session.get("refresh_token", ""),
                    user_id=user.get("id", ""),
                    email=data.email,
                )
            else:
                error_msg = response.json().get("msg", "Registration failed")
                raise HTTPException(status_code=400, detail=error_msg)

    except HTTPException:
        raise
    except Exception as e:
        logger.error("signup_error", error=str(e))
        raise HTTPException(status_code=500, detail="Registration failed")


@router.post("/signin", response_model=TokenResponse)
async def sign_in(data: SignInRequest):
    """Sign in via Supabase."""
    try:
        async with httpx.AsyncClient() as http:
            response = await http.post(
                f"{settings.supabase_url}/auth/v1/token?grant_type=password",
                json={"email": data.email, "password": data.password},
                headers={
                    "apikey": settings.supabase_anon_key,
                    "Content-Type": "application/json",
                },
                timeout=15,
            )

            if response.status_code == 200:
                result = response.json()
                user = result.get("user", {})

                return TokenResponse(
                    access_token=result.get("access_token", ""),
                    refresh_token=result.get("refresh_token", ""),
                    user_id=user.get("id", ""),
                    email=data.email,
                )
            else:
                raise HTTPException(status_code=401, detail="Invalid email or password")

    except HTTPException:
        raise
    except Exception as e:
        logger.error("signin_error", error=str(e))
        raise HTTPException(status_code=500, detail="Authentication failed")


@router.post("/refresh")
async def refresh_token(refresh_token: str):
    """Refresh access token."""
    try:
        async with httpx.AsyncClient() as http:
            response = await http.post(
                f"{settings.supabase_url}/auth/v1/token?grant_type=refresh_token",
                json={"refresh_token": refresh_token},
                headers={
                    "apikey": settings.supabase_anon_key,
                    "Content-Type": "application/json",
                },
                timeout=15,
            )

            if response.status_code == 200:
                result = response.json()
                return {
                    "access_token": result.get("access_token"),
                    "refresh_token": result.get("refresh_token"),
                }
            else:
                raise HTTPException(status_code=401, detail="Invalid refresh token")

    except HTTPException:
        raise
    except Exception as e:
        logger.error("token_refresh_error", error=str(e))
        raise HTTPException(status_code=500, detail="Token refresh failed")


@router.get("/me")
async def get_current_user(user: dict = Depends(verify_jwt)):
    """Get current authenticated user info."""
    return user
