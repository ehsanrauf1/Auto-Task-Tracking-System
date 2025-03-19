from ninja import Schema
from typing import Optional, List
from datetime import date, datetime

# Input Schemas
class TaskCreateIn(Schema):
    """Schema for task creation input"""
    title: str
    description: Optional[str] = None
    due_date: Optional[date] = None
    status: str = "todo"
    priority: str = "medium"
    project_id: int
    assigned_to_id: Optional[int] = None

class TaskUpdateIn(Schema):
    """Schema for task update input"""
    title: Optional[str] = None
    description: Optional[str] = None
    due_date: Optional[date] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    project_id: Optional[int] = None
    assigned_to_id: Optional[int] = None

# Output Schemas
class TaskUserOut(Schema):
    """Schema for task user output"""
    id: int
    username: str

class TaskProjectOut(Schema):
    """Schema for task project output"""
    id: int
    name: str

class TaskOut(Schema):
    """Schema for task output"""
    id: int
    title: str
    description: Optional[str] = None
    due_date: Optional[date] = None
    status: str
    priority: str
    created_at: datetime
    updated_at: datetime
    project: TaskProjectOut
    assigned_to: Optional[TaskUserOut] = None
    created_by: TaskUserOut
    
    @staticmethod
    def resolve_project(task):
        return task.project
    
    @staticmethod
    def resolve_assigned_to(task):
        return task.assigned_to
    
    @staticmethod
    def resolve_created_by(task):
        return task.created_by

class TaskListOut(Schema):
    """Schema for task list output"""
    tasks: List[TaskOut]
    count: int


# Add this new schema to your existing schemas.py file
class TaskStatsOut(Schema):
    """Schema for task statistics output"""
    total: int
    completed: int
    inProgress: int
    todo: int
    overdue: int