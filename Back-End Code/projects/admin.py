from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from .models import Project
from tasks.models import Task

class TaskInline(admin.TabularInline):
    """Inline admin for tasks within a project"""
    model = Task
    extra = 0
    fields = ('title', 'status', 'priority', 'due_date', 'assigned_to')
    raw_id_fields = ('assigned_to',)
    
    # Show only 5 tasks by default
    max_num = 10

@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    """Admin configuration for the Project model"""
    
    # Fields to display in the list view
    list_display = ('name', 'status_badge', 'created_by_link', 'created_at', 'updated_at', 'member_count', 'task_count')
    
    # Fields to filter by in the right sidebar
    list_filter = ('status', 'created_at', 'updated_at')
    
    # Fields to search by
    search_fields = ('name', 'description', 'created_by__username')
    
    # Date hierarchy for filtering
    date_hierarchy = 'created_at'
    
    # Many-to-many field display
    filter_horizontal = ('members',)
    
    # Inlines
    inlines = [TaskInline]
    
    # Custom form for adding/editing projects
    fieldsets = (
        (None, {
            'fields': ('name', 'description', 'status', 'created_by')
        }),
        ('Members', {
            'fields': ('members',),
            'classes': ('collapse',),
            'description': 'Select users who are members of this project.'
        }),
    )
    
    # Show created_by as a raw ID field
    raw_id_fields = ('created_by',)
    
    # Actions
    actions = ['add_current_user_as_member', 'mark_as_active', 'mark_as_on_hold', 'mark_as_completed', 'mark_as_archived', 'mark_as_cancelled']
    
    def status_badge(self, obj):
        """Return a colored badge for the project status"""
        status_colors = {
            Project.STATUS_ACTIVE: 'green',
            Project.STATUS_ON_HOLD: 'orange',
            Project.STATUS_COMPLETED: 'blue',
            Project.STATUS_ARCHIVED: 'gray',
            Project.STATUS_CANCELLED: 'red',
        }
        color = status_colors.get(obj.status, 'black')
        status_display = dict(Project.STATUS_CHOICES).get(obj.status, obj.status)
        return format_html('<span style="color:white; background-color:{}; padding:3px 7px; border-radius:3px;">{}</span>', color, status_display)
    status_badge.short_description = 'Status'
    
    def member_count(self, obj):
        """Return the number of members in the project"""
        count = obj.members.count()
        # Fix: Use the correct URL name for the custom admin site
        url = reverse('admin:users_user_changelist')
        return format_html('<a href="{}?projects__id__exact={}">{} members</a>', url, obj.id, count)
    member_count.short_description = 'Members'
    
    def task_count(self, obj):
        """Return the number of tasks in the project"""
        count = obj.tasks.count()
        # Fix: Use the correct URL name for the custom admin site
        url = reverse('admin:tasks_task_changelist')
        return format_html('<a href="{}?project__id__exact={}">{} tasks</a>', url, obj.id, count)
    task_count.short_description = 'Tasks'
    
    def created_by_link(self, obj):
        """Return a link to the user who created the project"""
        # Fix: Use the correct URL name for the custom admin site
        url = reverse('admin:users_user_change', args=[obj.created_by.id])
        return format_html('<a href="{}">{}</a>', url, obj.created_by.username)
    created_by_link.short_description = 'Created by'
    
    def add_current_user_as_member(self, request, queryset):
        """Add the current user as a member to selected projects"""
        for project in queryset:
            project.members.add(request.user)
        self.message_user(request, f"You were added as a member to {queryset.count()} projects.")
    add_current_user_as_member.short_description = "Add me as a member"
    
    # Status change actions
    def mark_as_active(self, request, queryset):
        """Mark selected projects as active"""
        updated = queryset.update(status=Project.STATUS_ACTIVE)
        self.message_user(request, f"{updated} projects marked as active.")
    mark_as_active.short_description = "Mark selected projects as active"
    
    def mark_as_on_hold(self, request, queryset):
        """Mark selected projects as on hold"""
        updated = queryset.update(status=Project.STATUS_ON_HOLD)
        self.message_user(request, f"{updated} projects marked as on hold.")
    mark_as_on_hold.short_description = "Mark selected projects as on hold"
    
    def mark_as_completed(self, request, queryset):
        """Mark selected projects as completed"""
        updated = queryset.update(status=Project.STATUS_COMPLETED)
        self.message_user(request, f"{updated} projects marked as completed.")
    mark_as_completed.short_description = "Mark selected projects as completed"
    
    def mark_as_archived(self, request, queryset):
        """Mark selected projects as archived"""
        updated = queryset.update(status=Project.STATUS_ARCHIVED)
        self.message_user(request, f"{updated} projects marked as archived.")
    mark_as_archived.short_description = "Mark selected projects as archived"
    
    def mark_as_cancelled(self, request, queryset):
        """Mark selected projects as cancelled"""
        updated = queryset.update(status=Project.STATUS_CANCELLED)
        self.message_user(request, f"{updated} projects marked as cancelled.")
    mark_as_cancelled.short_description = "Mark selected projects as cancelled"
    
    def get_queryset(self, request):
        """Optimize queryset with prefetch_related"""
        queryset = super().get_queryset(request)
        return queryset.prefetch_related('members', 'tasks')
    
    def save_model(self, request, obj, form, change):
        """Ensure the creator is added as a member"""
        is_new = obj.pk is None
        super().save_model(request, obj, form, change)
        
        # If this is a new project, add the creator as a member
        if is_new:
            obj.members.add(obj.created_by)