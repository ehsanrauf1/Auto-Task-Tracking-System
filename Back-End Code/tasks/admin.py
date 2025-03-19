from django import forms
from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from datetime import date
from .models import Task

class TaskAdminForm(forms.ModelForm):
    """Custom form for Task admin"""
    
    class Meta:
        model = Task
        fields = '__all__'
    
    def clean(self):
        """Custom validation for the task form"""
        cleaned_data = super().clean()
        due_date = cleaned_data.get('due_date')
        status = cleaned_data.get('status')
        project = cleaned_data.get('project')
        assigned_to = cleaned_data.get('assigned_to')
        
        # If task is marked as done, due date is not required
        if status == Task.STATUS_DONE and not due_date:
            return cleaned_data
        
        # Otherwise, due date is required
        if not due_date and status != Task.STATUS_DONE:
            self.add_error('due_date', 'Due date is required for tasks not marked as done.')
        
        # Check if assigned user is a member of the project
        if assigned_to and project and not project.members.filter(id=assigned_to.id).exists():
            self.add_error('assigned_to', 'Assigned user must be a member of the project.')
        
        return cleaned_data

@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    """Admin configuration for the Task model"""
    
    form = TaskAdminForm
    
    # Fields to display in the list view
    list_display = (
        'title', 
        'project_link', 
        'status_colored', 
        'priority_colored', 
        'due_date_colored', 
        'assigned_to_link', 
        'created_by_link'
    )
    
    # Fields to filter by in the right sidebar
    list_filter = (
        'status', 
        'priority', 
        'due_date', 
        'created_at', 
        'project',
        ('assigned_to', admin.RelatedOnlyFieldListFilter),
    )
    
    # Fields to search by
    search_fields = ('title', 'description', 'project__name', 'assigned_to__username', 'created_by__username')
    
    # Date hierarchy for filtering
    date_hierarchy = 'created_at'
    
    # Custom fieldsets for better organization
    fieldsets = (
        (None, {
            'fields': ('title', 'description')
        }),
        ('Project Information', {
            'fields': ('project',)
        }),
        ('Task Details', {
            'fields': ('status', 'priority', 'due_date')
        }),
        ('Assignment', {
            'fields': ('assigned_to', 'created_by')
        }),
    )
    
    # Show related fields as raw ID fields
    raw_id_fields = ('project', 'assigned_to', 'created_by')
    
    # Add actions
    actions = [
        'mark_as_todo', 
        'mark_as_in_progress', 
        'mark_as_done',
        'set_priority_low',
        'set_priority_medium',
        'set_priority_high',
        'assign_to_me',
    ]
    
    # Custom display methods
    def status_colored(self, obj):
        """Display status with color coding"""
        colors = {
            Task.STATUS_TODO: '#3498db',  # Blue
            Task.STATUS_IN_PROGRESS: '#f39c12',  # Orange
            Task.STATUS_DONE: '#2ecc71',  # Green
        }
        return format_html(
            '<span style="color: white; background-color: {}; padding: 3px 8px; border-radius: 3px;">{}</span>',
            colors.get(obj.status, 'black'),
            obj.get_status_display()
        )
    status_colored.short_description = 'Status'
    
    def priority_colored(self, obj):
        """Display priority with color coding"""
        colors = {
            Task.PRIORITY_LOW: '#2ecc71',  # Green
            Task.PRIORITY_MEDIUM: '#f39c12',  # Orange
            Task.PRIORITY_HIGH: '#e74c3c',  # Red
        }
        return format_html(
            '<span style="color: white; background-color: {}; padding: 3px 8px; border-radius: 3px;">{}</span>',
            colors.get(obj.priority, 'black'),
            obj.get_priority_display()
        )
    priority_colored.short_description = 'Priority'
    
    def due_date_colored(self, obj):
        """Display due date with color coding based on proximity"""
        if not obj.due_date:
            return '-'
        
        today = date.today()
        
        if obj.due_date < today:
            color = '#e74c3c'  # Red - Overdue
            prefix = '⚠️ '
        elif obj.due_date == today:
            color = '#f39c12'  # Orange - Due today
            prefix = '⏰ '
        else:
            color = '#2ecc71'  # Green - Future
            prefix = ''
        
        days_diff = (obj.due_date - today).days
        
        if days_diff < 0:
            days_text = f"({abs(days_diff)} days overdue)"
        elif days_diff == 0:
            days_text = "(Today)"
        elif days_diff == 1:
            days_text = "(Tomorrow)"
        else:
            days_text = f"(In {days_diff} days)"
        
        return format_html(
            '{}<span style="color: {};">{} <span style="color: #7f8c8d; font-size: 0.8em;">{}</span></span>',
            prefix,
            color,
            obj.due_date.strftime('%Y-%m-%d'),
            days_text
        )
    due_date_colored.short_description = 'Due Date'
    
    def project_link(self, obj):
        """Return a link to the project"""
        url = reverse('admin:projects_project_change', args=[obj.project.id])
        return format_html('<a href="{}">{}</a>', url, obj.project.name)
    project_link.short_description = 'Project'
    
    def assigned_to_link(self, obj):
        """Return a link to the assigned user"""
        if not obj.assigned_to:
            return '-'
        url = reverse('admin:users_user_change', args=[obj.assigned_to.id])
        return format_html('<a href="{}">{}</a>', url, obj.assigned_to.username)
    assigned_to_link.short_description = 'Assigned To'
    
    def created_by_link(self, obj):
        """Return a link to the user who created the task"""
        url = reverse('admin:users_user_change', args=[obj.created_by.id])
        return format_html('<a href="{}">{}</a>', url, obj.created_by.username)
    created_by_link.short_description = 'Created By'
    
    # Action methods
    def mark_as_todo(self, request, queryset):
        """Mark selected tasks as todo"""
        queryset.update(status=Task.STATUS_TODO)
        self.message_user(request, f"{queryset.count()} tasks were marked as To Do.")
    mark_as_todo.short_description = "Mark selected tasks as To Do"
    
    def mark_as_in_progress(self, request, queryset):
        """Mark selected tasks as in progress"""
        queryset.update(status=Task.STATUS_IN_PROGRESS)
        self.message_user(request, f"{queryset.count()} tasks were marked as In Progress.")
    mark_as_in_progress.short_description = "Mark selected tasks as In Progress"
    
    def mark_as_done(self, request, queryset):
        """Mark selected tasks as done"""
        queryset.update(status=Task.STATUS_DONE)
        self.message_user(request, f"{queryset.count()} tasks were marked as Done.")
    mark_as_done.short_description = "Mark selected tasks as Done"
    
    def set_priority_low(self, request, queryset):
        """Set priority to low for selected tasks"""
        queryset.update(priority=Task.PRIORITY_LOW)
        self.message_user(request, f"{queryset.count()} tasks were set to Low priority.")
    set_priority_low.short_description = "Set priority to Low"
    
    def set_priority_medium(self, request, queryset):
        """Set priority to medium for selected tasks"""
        queryset.update(priority=Task.PRIORITY_MEDIUM)
        self.message_user(request, f"{queryset.count()} tasks were set to Medium priority.")
    set_priority_medium.short_description = "Set priority to Medium"
    
    def set_priority_high(self, request, queryset):
        """Set priority to high for selected tasks"""
        queryset.update(priority=Task.PRIORITY_HIGH)
        self.message_user(request, f"{queryset.count()} tasks were set to High priority.")
    set_priority_high.short_description = "Set priority to High"
    
    def assign_to_me(self, request, queryset):
        """Assign selected tasks to the current user"""
        queryset.update(assigned_to=request.user)
        self.message_user(request, f"{queryset.count()} tasks were assigned to you.")
    assign_to_me.short_description = "Assign to me"
    
    def get_queryset(self, request):
        """Optimize queryset with select_related"""
        queryset = super().get_queryset(request)
        return queryset.select_related('project', 'assigned_to', 'created_by')
    
    def save_model(self, request, obj, form, change):
        """Set created_by if not provided"""
        if not change and not obj.created_by:
            obj.created_by = request.user
        super().save_model(request, obj, form, change)