from ninja.security import HttpBearer
from django.contrib.auth import get_user_model
from .utils import decode_token

User = get_user_model()

class AuthBearer(HttpBearer):
    """
    Authentication class for Django Ninja
    Validates JWT tokens in the Authorization header
    """
    
    def authenticate(self, request, token):
        """
        Authenticate the request using the JWT token
        
        Args:
            request: HTTP request
            token: JWT token from Authorization header
            
        Returns:
            User object if authentication successful, None otherwise
        """
        payload = decode_token(token)
        
        if payload and payload.get("type") == "access":
            user_id = payload.get("user_id")
            try:
                return User.objects.get(id=user_id)
            except User.DoesNotExist:
                pass
        
        return None