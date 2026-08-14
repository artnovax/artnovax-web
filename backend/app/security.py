from fastapi import HTTPException

from .config import ADMIN_TOKEN


def require_admin(x_admin_token: str | None) -> None:
    if not ADMIN_TOKEN:
        raise HTTPException(status_code=503, detail="Admin access is not configured.")
    if not x_admin_token or x_admin_token != ADMIN_TOKEN:
        raise HTTPException(status_code=401, detail="Unauthorized")
