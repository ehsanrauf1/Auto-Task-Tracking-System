from django.db import models
from django.conf import settings

class Project(models.Model):
    """Project model for categorizing tasks"""
    
    # Status choices
   
    STATUS_ACTIVE = 'active'
    STATUS_ON_HOLD = 'on_hold'
    STATUS_COMPLETED = 'completed'
    STATUS_ARCHIVED = 'archived'
    STATUS_CANCELLED = 'cancelled'
    
    STATUS_CHOICES = [
     
        (STATUS_ACTIVE, 'Active'),
        (STATUS_ON_HOLD, 'On Hold'),
        (STATUS_COMPLETED, 'Completed'),
        (STATUS_ARCHIVED, 'Archived'),
        (STATUS_CANCELLED, 'Cancelled'),
    ]
    
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default=STATUS_ACTIVE
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='created_projects'
    )
    members = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name='projects',
        blank=True
    )
    
    def __str__(self):
        return self.name