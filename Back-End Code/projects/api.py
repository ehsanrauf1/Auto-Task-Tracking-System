from ninja import Router
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model
from .models import Project
from .schemas import (
    ProjectCreateIn, ProjectUpdateIn, ProjectMemberIn,
    ProjectOut, ProjectDetailOut, ProjectStatsOut
)
from users.auth import AuthBearer
from typing import List
from django.db.models import Count

User = get_user_model()
router = Router()
auth = AuthBearer()


# Add this new endpoint to your projects router
@router.get("/stats", response=ProjectStatsOut, auth=auth)
def get_project_stats(request):
    """Get project statistics by status"""
    user = request.auth
    
    # Base queryset - projects the user has access to
    if user.is_admin:
        queryset = Project.objects.all()
    else:
        queryset = Project.objects.filter(members=user)
    
    # Get counts by status
    total = queryset.count()
    active = queryset.filter(status=Project.STATUS_ACTIVE).count()
    on_hold = queryset.filter(status=Project.STATUS_ON_HOLD).count()
    completed = queryset.filter(status=Project.STATUS_COMPLETED).count()
    archived = queryset.filter(status=Project.STATUS_ARCHIVED).count()
    cancelled = queryset.filter(status=Project.STATUS_CANCELLED).count()
    
    return {
        "total": total,
        "active": active,
        "onHold": on_hold,
        "completed": completed,
        "archived": archived,
        "cancelled": cancelled
    }


# Get all projects
@router.get("/", response=List[ProjectOut], auth=auth)
def list_projects(request):
    """List all projects the user is a member of"""
    user = request.auth
    # If user is admin, return all projects
    if user.is_admin:
        return Project.objects.annotate(task_count=Count('tasks'),member_count=Count('members'))
    # Otherwise, return projects the user is a member of
    return Project.objects.filter(members=user).annotate(task_count=Count('tasks'),member_count=Count('members'))



# Create a new project
@router.post("/", response=ProjectOut, auth=auth)
def create_project(request, data: ProjectCreateIn):
    """Create a new project"""
    user = request.auth
    project = Project.objects.create(
        name=data.name,
        description=data.description or "",
        created_by=user
    )
    # Add creator as a member
    project.members.add(user)
    return project

# Get project details
@router.get("/{project_id}", response=ProjectDetailOut, auth=auth)
def get_project(request, project_id: int):
    """Get project details"""
    user = request.auth
    project = get_object_or_404(Project, id=project_id)
    
    # Check if user is a member or admin
    if not (user.is_admin or project.members.filter(id=user.id).exists()):
        return {"detail": "Not found"}
    
    return project

# Update project
@router.put("/{project_id}", response=ProjectOut, auth=auth)
def update_project(request, project_id: int, data: ProjectUpdateIn):
    """Update project details"""
    user = request.auth
    project = get_object_or_404(Project, id=project_id)
    
    # Check if user is admin or project creator
    if not (user.is_admin or project.created_by == user):
        return {"detail": "Permission denied"}
    
    # Update fields
    if data.name:
        project.name = data.name
    if data.description is not None:
        project.description = data.description
    if data.status:
        project.status = data.status
    
    project.save()
    return project

# Delete project
@router.delete("/{project_id}", auth=auth)
def delete_project(request, project_id: int):
    """Delete a project"""
    user = request.auth
    project = get_object_or_404(Project, id=project_id)
    
    # Check if user is admin or project creator
    if not (user.is_admin or project.created_by == user):
        return {"detail": "Permission denied"}
    
    project.delete()
    return {"success": True}

# Add member to project
@router.post("/{project_id}/members", response=ProjectDetailOut, auth=auth)
def add_member(request, project_id: int, data: ProjectMemberIn):
    """Add a member to the project"""
    user = request.auth
    project = get_object_or_404(Project, id=project_id)
    
    # Check if user is admin or project creator
    if not (user.is_admin or project.created_by == user):
        return {"detail": "Permission denied"}
    
    # Get user to add
    member = get_object_or_404(User, id=data.user_id)
    project.members.add(member)
    
    return project

# Remove member from project
@router.delete("/{project_id}/members/{user_id}", response=ProjectDetailOut, auth=auth)
def remove_member(request, project_id: int, user_id: int):
    """Remove a member from the project"""
    user = request.auth
    project = get_object_or_404(Project, id=project_id)
    
    # Check if user is admin or project creator
    if not (user.is_admin or project.created_by == user):
        return {"detail": "Permission denied"}
    
    # Get user to remove
    member = get_object_or_404(User, id=user_id)
    project.members.remove(member)
    
    return project