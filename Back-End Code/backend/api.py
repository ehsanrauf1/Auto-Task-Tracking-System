from ninja import NinjaAPI
from users.api import router as users_router
from projects.api import router as projects_router
from tasks.api import router as tasks_router
from users.auth import AuthBearer

api = NinjaAPI()

# Add routers
api.add_router("/auth/", users_router)
api.add_router("/projects/", projects_router)
api.add_router("/tasks/", tasks_router)