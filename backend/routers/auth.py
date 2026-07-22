from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr, field_validator
from sqlalchemy.orm import Session

from database import get_db
from models import RefreshToken, User
from services.auth_service import (
    create_access_token,
    create_refresh_token,
    hash_password,
    hash_refresh_token,
    verify_password,
)

router = APIRouter(prefix="/auth", tags=["auth"])


class SignupRequest(BaseModel):
    email: EmailStr
    password: str

    @field_validator("password")
    @classmethod
    def password_min_length(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long.")
        return v


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RefreshRequest(BaseModel):
    refresh_token: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    email: str


class AccessTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


def _issue_tokens(db: Session, user: User) -> TokenResponse:
    """Create a fresh access + refresh token pair and store the refresh token's hash."""
    access_token = create_access_token(user.id, user.email)
    raw_refresh_token, token_hash, expires_at = create_refresh_token()

    db.add(RefreshToken(user_id=user.id, token_hash=token_hash, expires_at=expires_at))
    db.commit()

    return TokenResponse(
        access_token=access_token,
        refresh_token=raw_refresh_token,
        email=user.email,
    )


@router.post("/signup", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def signup(request: SignupRequest, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == request.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists.",
        )

    user = User(
        email=request.email,
        hashed_password=hash_password(request.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    return _issue_tokens(db, user)


@router.post("/login", response_model=TokenResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == request.email).first()

    if not user or not verify_password(request.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
        )

    return _issue_tokens(db, user)


@router.post("/refresh", response_model=AccessTokenResponse)
def refresh(request: RefreshRequest, db: Session = Depends(get_db)):
    """
    Exchange a valid, unexpired, unrevoked refresh token for a brand new
    access token. The frontend calls this automatically when a request
    comes back 401 due to access token expiry, so the user never has to
    manually log back in every 30 minutes.
    """
    token_hash = hash_refresh_token(request.refresh_token)
    stored_token = (
        db.query(RefreshToken)
        .filter(RefreshToken.token_hash == token_hash)
        .first()
    )

    invalid_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Refresh token is invalid or expired. Please log in again.",
    )

    if stored_token is None or stored_token.revoked:
        raise invalid_exception

    if stored_token.expires_at < datetime.utcnow():
        raise invalid_exception

    user = db.query(User).filter(User.id == stored_token.user_id).first()
    if user is None:
        raise invalid_exception

    access_token = create_access_token(user.id, user.email)
    return AccessTokenResponse(access_token=access_token)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(request: RefreshRequest, db: Session = Depends(get_db)):
    """
    Revoke a refresh token on logout so it can no longer be used to mint
    new access tokens, even if someone else has a copy of it.
    """
    token_hash = hash_refresh_token(request.refresh_token)
    stored_token = (
        db.query(RefreshToken)
        .filter(RefreshToken.token_hash == token_hash)
        .first()
    )
    if stored_token is not None:
        stored_token.revoked = 1
        db.commit()
