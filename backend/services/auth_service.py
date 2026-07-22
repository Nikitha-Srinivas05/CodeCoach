import hashlib
import os
import secrets
from datetime import datetime, timedelta, timezone

import bcrypt
import jwt

JWT_SECRET = os.getenv("JWT_SECRET", "dev-only-secret-change-in-production")
JWT_REFRESH_SECRET = os.getenv("JWT_REFRESH_SECRET", "dev-only-refresh-secret-change-in-production")
JWT_ALGORITHM = "HS256"

ACCESS_TOKEN_EXPIRY_MINUTES = 30
REFRESH_TOKEN_EXPIRY_DAYS = 30


def hash_password(password: str) -> str:
    """Hash a plaintext password for storage. Never store raw passwords."""
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, hashed_password: str) -> bool:
    """Check a plaintext password against a stored bcrypt hash."""
    return bcrypt.checkpw(password.encode("utf-8"), hashed_password.encode("utf-8"))


def create_access_token(user_id: int, email: str) -> str:
    """Issue a signed JWT that expires after ACCESS_TOKEN_EXPIRY_MINUTES."""
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRY_MINUTES)
    payload = {"sub": str(user_id), "email": email, "exp": expire}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_access_token(token: str) -> dict:
    """Decode and verify an access JWT. Raises jwt exceptions if invalid/expired."""
    return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])


def create_refresh_token() -> tuple[str, str, datetime]:
    """
    Generate a new refresh token.

    Returns (raw_token, token_hash, expires_at):
    - raw_token is what gets sent to the client (once — never stored raw)
    - token_hash is what gets stored in the database
    - expires_at is stored alongside it so we can reject expired tokens
      without needing to decode anything

    Note: SQLite doesn't preserve timezone info on round-trip even when the
    column is declared DateTime(timezone=True) — it comes back naive. So we
    store and compare this as naive UTC throughout, rather than mixing
    aware and naive datetimes (which raises a TypeError on comparison).
    """
    raw_token = secrets.token_urlsafe(48)
    token_hash = hash_refresh_token(raw_token)
    expires_at = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRY_DAYS)
    return raw_token, token_hash, expires_at


def hash_refresh_token(raw_token: str) -> str:
    """
    Hash a refresh token for storage/lookup.

    Refresh tokens are high-value (long-lived), so we never store them in
    plaintext — same reasoning as password hashing. SHA-256 (not bcrypt) is
    fine here because the token itself is already a long random string, not
    a human-guessable password.
    """
    secret = JWT_REFRESH_SECRET.encode("utf-8")
    return hashlib.sha256(secret + raw_token.encode("utf-8")).hexdigest()
