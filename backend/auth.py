import os
import httpx
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

SUPABASE_URL = os.getenv("SUPABASE_URL", "").rstrip("/")

if not SUPABASE_URL:
    raise ValueError("SUPABASE_URL environment variable is required")

security = HTTPBearer()


def require_auth(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        with httpx.Client() as client:
            response = client.get(
                f"{SUPABASE_URL}/auth/v1/user",
                headers={"Authorization": f"Bearer {credentials.credentials}"},
                timeout=10.0,
            )

        if response.status_code == 401:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired token",
            )
        if response.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Token verification failed: {response.text}",
            )

        user_data = response.json()
        user_id = user_data.get("id")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: missing user ID",
            )
        return user_id
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Unable to verify token: {e}",
        )
