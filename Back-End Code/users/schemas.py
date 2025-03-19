from ninja import Schema
from typing import Optional
from datetime import datetime

# Input Schemas

class UserRegistrationIn(Schema):
    """Schema for user registration input"""
    username: str
    email: str
    password: str
    password_confirm: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None

class UserLoginIn(Schema):
    """Schema for user login input"""
    email: str
    password: str

class TokenRefreshIn(Schema):
    """Schema for token refresh input"""
    refresh: str

class UserUpdateIn(Schema):
    """Schema for user profile update input"""
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[str] = None
    bio: Optional[str] = None
    profile_image: Optional[str] = None

class PasswordChangeIn(Schema):
    """Schema for password change input"""
    current_password: str
    new_password: str
    confirm_password: str

class PasswordResetRequestIn(Schema):
    """Schema for password reset request input"""
    email: str

class PasswordResetConfirmIn(Schema):
    """Schema for password reset confirmation input"""
    token: str
    new_password: str
    confirm_password: str

# Output Schemas

class TokenOut(Schema):
    """Schema for token response"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

class UserOut(Schema):
    """Schema for user data output"""
    id: int
    username: str
    email: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    role: str
    bio: Optional[str] = None
    profile_image: Optional[str] = None
    date_joined: datetime
    is_admin: bool

class MessageOut(Schema):
    """Schema for message responses"""
    message: str
    
class ErrorOut(Schema):
    """Schema for error responses"""
    error: str