from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.utils.translation import gettext_lazy as _
from .models import User

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    """Admin configuration for the custom User model"""
    
    # Fields to display in the list view
    list_display = ('username', 'email', 'first_name', 'last_name', 'role', 'is_active', 'is_staff', 'date_joined')
    
    # Fields to filter by in the right sidebar
    list_filter = ('role', 'is_active', 'is_staff', 'is_superuser', 'date_joined')
    
    # Fields to search by
    search_fields = ('username', 'email', 'first_name', 'last_name')
    
    # Default ordering
    ordering = ('username',)
    
    # Fields to display in the detail view, grouped into fieldsets
    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        (_('Personal info'), {'fields': ('first_name', 'last_name', 'email')}),
        (_('Role'), {'fields': ('role',)}),
        (_('Profile'), {'fields': ('bio', 'profile_image')}),
        (_('Permissions'), {
            'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions'),
            'classes': ('collapse',),
        }),
        (_('Important dates'), {'fields': ('last_login', 'date_joined')}),
    )
    
    # Fields to display when adding a new user
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('username', 'email', 'password1', 'password2', 'role', 'is_staff', 'is_superuser'),
        }),
    )
    
    # Fields that can be edited directly from the list view
    list_editable = ('is_active',)
    
    # Actions available in the list view
    actions = ['activate_users', 'deactivate_users', 'set_as_admin', 'set_as_standard']
    
    def activate_users(self, request, queryset):
        """Action to activate selected users"""
        queryset.update(is_active=True)
        self.message_user(request, f"{queryset.count()} users were successfully activated.")
    activate_users.short_description = "Activate selected users"
    
    def deactivate_users(self, request, queryset):
        """Action to deactivate selected users"""
        queryset.update(is_active=False)
        self.message_user(request, f"{queryset.count()} users were successfully deactivated.")
    deactivate_users.short_description = "Deactivate selected users"
    
    def set_as_admin(self, request, queryset):
        """Action to set selected users as admins"""
        queryset.update(role=User.ROLE_ADMIN)
        self.message_user(request, f"{queryset.count()} users were set as administrators.")
    set_as_admin.short_description = "Set selected users as administrators"
    
    def set_as_standard(self, request, queryset):
        """Action to set selected users as standard users"""
        queryset.update(role=User.ROLE_STANDARD)
        self.message_user(request, f"{queryset.count()} users were set as standard users.")
    set_as_standard.short_description = "Set selected users as standard users"
    
    # Save method to ensure superusers have admin role
    def save_model(self, request, obj, form, change):
        """Ensure superusers have admin role"""
        if obj.is_superuser and obj.role != User.ROLE_ADMIN:
            obj.role = User.ROLE_ADMIN
        super().save_model(request, obj, form, change)