from ninja import Router
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model
from django.db.models import Q
from .models import Task
from projects.models import Project
from django.utils import timezone
from .schemas import (
    TaskCreateIn, TaskUpdateIn, TaskOut, TaskListOut, TaskStatsOut
)
from users.auth import AuthBearer
from typing import Dict, List, Optional

User = get_user_model()
router = Router()
auth = AuthBearer()


from datetime import datetime
import pytz  # Make sure to import pytz

@router.get("/stats", response=Dict, auth=auth)
def get_task_stats(request):
    """Get task statistics for the current user"""
    user = request.auth
    
    # Base queryset - tasks the user has access to
    if user.is_admin:
        queryset = Task.objects.all()
    else:
        user_projects = user.projects.all()
        queryset = Task.objects.filter(
            Q(project__in=user_projects) | Q(assigned_to=user) | Q(created_by=user)
        ).distinct()
    
    # Get counts by status - handle different formats
    total = queryset.count()
    
    # For "done" status - try multiple formats
    completed = queryset.filter(
        Q(status__iexact="done") | 
        Q(status__iexact="DONE") | 
        Q(status="Done")
    ).count()
    
    # For "in_progress" status - try multiple formats
    in_progress = queryset.filter(
        Q(status__iexact="in_progress") | 
        Q(status__iexact="IN_PROGRESS") | 
        Q(status="In Progress")
    ).count()
    
    # For "todo" status - try multiple formats
    todo = queryset.filter(
        Q(status__iexact="todo") | 
        Q(status__iexact="TODO") | 
        Q(status="To Do")
    ).count()
    
    # Get overdue tasks using UTC timezone
    today = datetime.now(pytz.UTC).date()
    overdue = queryset.filter(
        due_date__lt=today
    ).exclude(
        Q(status__iexact="done") | 
        Q(status__iexact="DONE") | 
        Q(status="Done")
    ).count()
    
    return {
        "total": total,
        "completed": completed,
        "inProgress": in_progress,
        "todo": todo,
        "overdue": overdue
    }


# List tasks with filtering
@router.get("/", response=TaskListOut, auth=auth)
def list_tasks(
    request,
    project_id: Optional[int] = None,
    status: Optional[str] = None,
    priority: Optional[str] = None,
    assigned_to_id: Optional[int] = None
):
    """List tasks with optional filtering"""
    user = request.auth
    
    # Base queryset
    queryset = Task.objects.all()
    
    # Apply filters
    if project_id:
        queryset = queryset.filter(project_id=project_id)
    if status:
        queryset = queryset.filter(status=status)
    if priority:
        queryset = queryset.filter(priority=priority)
    if assigned_to_id:
        queryset = queryset.filter(assigned_to_id=assigned_to_id)
    
    # Filter by user access
    if not user.is_admin:
        # User can see tasks in projects they're a member of
        user_projects = user.projects.all()
        queryset = queryset.filter(
            Q(project__in=user_projects) | Q(assigned_to=user) | Q(created_by=user)
        )
    
    return {
        "tasks": queryset,
        "count": queryset.count()
    }

# Create task
@router.post("/", response=TaskOut, auth=auth)
def create_task(request, data: TaskCreateIn):
    """Create a new task"""
    user = request.auth
    
    # Get project
    project = get_object_or_404(Project, id=data.project_id)
    
    # Check if user is a member of the project
    if not (user.is_admin or project.members.filter(id=user.id).exists()):
        return {"detail": "Permission denied"}
    
    # Get assigned user if provided
    assigned_to = None
    if data.assigned_to_id:
        assigned_to = get_object_or_404(User, id=data.assigned_to_id)
        # Check if assigned user is a member of the project
        if not project.members.filter(id=assigned_to.id).exists():
            return {"detail": "Assigned user is not a member of the project"}
    
    # Create task
    task = Task.objects.create(
        title=data.title,
        description=data.description or "",
        due_date=data.due_date,
        status=data.status,
        priority=data.priority,
        project=project,
        assigned_to=assigned_to,
        created_by=user
    )
    
    return task

# Get task details
@router.get("/{task_id}", response=TaskOut, auth=auth)
def get_task(request, task_id: int):
    """Get task details"""
    user = request.auth
    task = get_object_or_404(Task, id=task_id)
    
    # Check if user has access to the task
    if not user.is_admin:
        project = task.project
        if not (
            project.members.filter(id=user.id).exists() or
            task.assigned_to == user or
            task.created_by == user
        ):
            return {"detail": "Not found"}
    
    return task

# Update task
@router.put("/{task_id}", response=TaskOut, auth=auth)
def update_task(request, task_id: int, data: TaskUpdateIn):
    """Update task details"""
    user = request.auth
    task = get_object_or_404(Task, id=task_id)
    
    # Check if user has permission to update
    if not (user.is_admin or task.created_by == user or task.assigned_to == user):
        return {"detail": "Permission denied"}
    
    # Standard users can only update certain fields if they're not the creator
    if not (user.is_admin or task.created_by == user):
        # Only allow updating status if assigned to the user
        if data.status and task.assigned_to == user:
            task.status = data.status
        return task
    
    # Admin or creator can update all fields
    if data.title:
        task.title = data.title
    if data.description is not None:
        task.description = data.description
    if data.due_date:
        task.due_date = data.due_date
    if data.status:
        task.status = data.status
    if data.priority:
        task.priority = data.priority
    
    # Update project if provided
    if data.project_id:
        project = get_object_or_404(Project, id=data.project_id)
        # Check if user has access to the new project
        if not (user.is_admin or project.members.filter(id=user.id).exists()):
            return {"detail": "Permission denied for the selected project"}
        task.project = project
    
    # Update assigned user if provided
    if data.assigned_to_id:
        assigned_to = get_object_or_404(User, id=data.assigned_to_id)
        # Check if assigned user is a member of the project
        if not task.project.members.filter(id=assigned_to.id).exists():
            return {"detail": "Assigned user is not a member of the project"}
        task.assigned_to = assigned_to
    elif data.assigned_to_id is None:
        # Explicitly set to None if null is provided
        task.assigned_to = None
    
    task.save()
    return task

# Delete task
@router.delete("/{task_id}", auth=auth)
def delete_task(request, task_id: int):
    """Delete a task"""
    user = request.auth
    task = get_object_or_404(Task, id=task_id)
    
    # Check if user has permission to delete
    if not (user.is_admin or task.created_by == user):
        return {"detail": "Permission denied"}
    
    task.delete()
    return {"success": True}