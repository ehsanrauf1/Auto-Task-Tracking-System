import jwt
from datetime import datetime, timedelta
from django.conf import settings
from typing import Dict, Any

def create_token(user_id: int, username: str, role: str, token_type: str = "access", expires_delta: timedelta = None) -> str:
    """
    Create a JWT token for the user
    
    Args:
        user_id: User ID
        username: Username
        role: User role
        token_type: Token type (access or refresh)
        expires_delta: Token expiration time
        
    Returns:
        JWT token string
    """
    # Set default expiration times
    if expires_delta is None:
        if token_type == "access":
            expires_delta = timedelta(days=7)  # 7 days for refresh token
        else:
            expires_delta = timedelta(days=7)  # 7 days for refresh token
    
    # Create payload
    payload = {
        "user_id": user_id,
        "username": username,
        "role": role,
        "type": token_type,
        "exp": datetime.utcnow() + expires_delta,
        "iat": datetime.utcnow()
    }
    
    # Create token
    encoded_jwt = jwt.encode(payload, settings.SECRET_KEY, algorithm="HS256")
    return encoded_jwt

def decode_token(token: str) -> Dict[str, Any]:
    """
    Decode and validate a JWT token
    
    Args:
        token: JWT token string
        
    Returns:
        Decoded token payload
    """
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        return payload
    except jwt.PyJWTError:
        return None