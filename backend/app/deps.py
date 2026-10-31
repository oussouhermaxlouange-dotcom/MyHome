from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt import InvalidTokenError
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User
from app.security import decode_token

bearer = HTTPBearer(auto_error=False)


def get_current_user(
    creds: HTTPAuthorizationCredentials | None = Depends(bearer),
    db: Session = Depends(get_db),
) -> User:
    if creds is None:
        raise HTTPException(status_code=401, detail="Authentification requise.")
    try:
        payload = decode_token(creds.credentials)
    except InvalidTokenError:
        raise HTTPException(status_code=401, detail="Session expirée. Reconnectez-vous.")
    user = db.get(User, payload.get("sub"))
    if not user:
        raise HTTPException(status_code=401, detail="Utilisateur introuvable.")
    if user.is_blocked:
        raise HTTPException(status_code=403, detail="Ce compte est temporairement bloqué.")
    return user


def get_optional_user(
    creds: HTTPAuthorizationCredentials | None = Depends(bearer),
    db: Session = Depends(get_db),
) -> User | None:
    if creds is None:
        return None
    try:
        payload = decode_token(creds.credentials)
    except InvalidTokenError:
        return None
    user = db.get(User, payload.get("sub"))
    if user and user.is_blocked:
        raise HTTPException(status_code=403, detail="Ce compte est temporairement bloqué.")
    return user


class RequireRole:
    """FastAPI dependency enforcing one of the allowed account roles."""

    ROLE_ALIASES = {
        "VISITEUR": "visitor",
        "LOCATAIRE": "tenant",
        "PROPRIETAIRE": "landlord",
        "ADMIN": "admin",
    }

    def __init__(self, *roles: str):
        self.roles = frozenset(self.ROLE_ALIASES.get(role.upper(), role.lower()) for role in roles)

    def __call__(self, user: User = Depends(get_current_user)) -> User:
        if user.is_blocked:
            raise HTTPException(status_code=403, detail="Ce compte est temporairement bloqué.")
        if user.role not in self.roles:
            raise HTTPException(status_code=403, detail="Accès réservé à un autre rôle.")
        return user
