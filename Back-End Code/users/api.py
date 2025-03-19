from ninja import Router
from django.contrib.auth import get_user_model, authenticate
from django.shortcuts import get_object_or_404
from .schemas import (
    UserRegistrationIn, UserLoginIn, TokenRefreshIn, UserUpdateIn,
    TokenOut, UserOut, MessageOut, ErrorOut
)
from .utils import create_token, decode_token
from typing import Dict

User = get_user_model()
router = Router()


@router.get("/users", response={200: list[UserOut], 403: ErrorOut, 401: ErrorOut})
def get_all_users(request):
    """Get all users information (admin only)"""
    # Get the authorization header
    auth_header = request.headers.get('Authorization')
    
    if not auth_header or not auth_header.startswith('Bearer '):
        return 401, {"error": "Authentication required"}
    
    # Extract the token
    token = auth_header.split(' ')[1]
    
    # Decode and validate the token
    payload = decode_token(token)
    
    if not payload or payload.get("type") != "access":
        return 401, {"error": "Invalid access token"}
    
    # Check if user exists and is an admin
    try:
        user = User.objects.get(id=payload.get("user_id"))
        
        # Check if user has admin role
        if user.role != 'admin':
            return 403, {"error": "Admin privileges required"}
            
        # If user is admin, return all users
        users = User.objects.all()
        return 200, users
        
    except User.DoesNotExist:
        return 401, {"error": "User not found"}
    
@router.post("/register", response={201: UserOut, 400: ErrorOut})
def register(request, data: UserRegistrationIn):
    """Register a new user"""
    # Check if passwords match
    if data.password != data.password_confirm:
        return 400, {"error": "Passwords do not match"}
    
    # Check if username exists
    if User.objects.filter(username=data.username).exists():
        return 400, {"error": "Username already exists"}
    
    # Check if email exists
    if User.objects.filter(email=data.email).exists():
        return 400, {"error": "Email already exists"}
    
    # Create user
    user = User.objects.create_user(
        username=data.username,
        email=data.email,
        password=data.password,
        first_name=data.first_name or "",
        last_name=data.last_name or ""
    )
    
    return 201, user

@router.post("/login", response={200: TokenOut, 401: ErrorOut})
def login(request, data: UserLoginIn):
    """Login user and return tokens"""
    # Find the user by email first
    try:
        user_obj = User.objects.get(email=data.email)
        # Then authenticate with the username and password
        user = authenticate(username=user_obj.username, password=data.password)
    except User.DoesNotExist:
        user = None
    
    if not user:
        return 401, {"error": "Invalid credentials"}
    
    # Create tokens
    access_token = create_token(
        user_id=user.id,
        username=user.username,
        role=user.role,
        token_type="access"
    )
    
    refresh_token = create_token(
        user_id=user.id,
        username=user.username,
        role=user.role,
        token_type="refresh"
    )
    
    return 200, {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name
        }
    }


@router.post("/refresh", response={200: Dict, 401: ErrorOut})
def refresh_token(request, data: TokenRefreshIn):
    """Refresh access token"""
    payload = decode_token(data.refresh)
    
    if not payload or payload.get("type") != "refresh":
        return 401, {"error": "Invalid refresh token"}
    
    try:
        user = User.objects.get(id=payload.get("user_id"))
    except User.DoesNotExist:
        return 401, {"error": "User not found"}
    
    # Create new access token
    access_token = create_token(
        user_id=user.id,
        username=user.username,
        role=user.role,
        token_type="access"
    )
    
    return 200, {"access_token": access_token}

@router.get("/me", response=UserOut, auth=None)  # We'll add auth later
def get_user_profile(request):
    """Get current user profile"""
    # This is a placeholder - we'll implement proper authentication later
    # For now, just return the first user
    user = User.objects.first()
    return user