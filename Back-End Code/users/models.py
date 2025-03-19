from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    """
    Custom User model extending Django's AbstractUser.
    
    AbstractUser already includes:
    - username
    - email
    - password
    - first_name
    - last_name
    - is_active
    - is_staff
    - date_joined
    """
    
    # User role choices
    ROLE_STANDARD = 'standard'
    ROLE_ADMIN = 'admin'
    
    ROLE_CHOICES = [
        (ROLE_STANDARD, 'Standard User'),
        (ROLE_ADMIN, 'Administrator'),
    ]
    
    # Additional fields
    role = models.CharField(
        max_length=10,
        choices=ROLE_CHOICES,
        default=ROLE_STANDARD,
        help_text='User role determines permissions'
    )
    bio = models.TextField(blank=True, help_text='User biography')
    profile_image = models.URLField(blank=True, help_text='URL to profile image')
    
    class Meta:
        verbose_name = 'User'
        verbose_name_plural = 'Users'
    
    @property
    def is_admin(self):
        """Check if user has admin role"""
        return self.role == self.ROLE_ADMIN or self.is_staff
    
    def __str__(self):
        return self.username