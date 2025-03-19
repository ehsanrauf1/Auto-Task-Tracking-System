"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus,
  ArrowRight,
  Edit,
  Calendar,
  Users,
  CheckSquare,
} from "lucide-react";
import { getTasks } from "@/actions/task-actions";
import { getProjects } from "@/actions/project-actions";
import { getUserFromCookies } from "@/actions/auth-actions";
// Import the UsersTable component at the top of the file
import UsersTable from "@/components/users-table";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [userLoading, setUserLoading] = useState(true);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [projectsLoading, setProjectsLoading] = useState(true);

  // Fetch data on component mount
  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch user data
        setUserLoading(true);
        const userData = await getUserFromCookies();
        setUser(userData?.user || null);
        setUserLoading(false);

        // Fetch recent tasks
        setTasksLoading(true);
        const taskResult = await getTasks();
        if (taskResult.success) {
          setTasks(taskResult.tasks.slice(0, 3) || []); // Only show 5 most recent tasks
        }
        setTasksLoading(false);

        // Fetch recent projects
        setProjectsLoading(true);
        const projectResult = await getProjects();
        if (projectResult.success) {
          setProjects(projectResult.projects.slice(0, 3) || []); // Only show 5 most recent projects
        }
        setProjectsLoading(false);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        setUserLoading(false);
        setTasksLoading(false);
        setProjectsLoading(false);
      }
    }

    fetchData();
  }, []);

  const firstName =
    user?.first_name || user?.username?.split(" ")[0] || "there";

  // Update the getStatusBadge and getStatusClass functions to match the projects page

  const getStatusBadge = (status) => {
    return (
      <span
        className={`px-2 py-1 rounded-full text-xs ${getStatusClass(status)}`}
      >
        {getStatusText(status)}
      </span>
    );
  };

  const getStatusClass = (status) => {
    const normalized = normalizeStatus(status);
    if (normalized === "completed") return "bg-green-100 text-green-800";
    if (normalized === "active") return "bg-blue-100 text-blue-800";
    if (normalized === "on_hold") return "bg-yellow-100 text-yellow-800";
    if (normalized === "archived") return "bg-gray-100 text-gray-800";
    if (normalized === "cancelled") return "bg-red-100 text-red-800";
    if (normalized === "done") return "bg-green-100 text-green-800";
    if (normalized === "in_progress") return "bg-blue-100 text-blue-800";
    if (normalized === "todo") return "bg-yellow-100 text-yellow-800";
    return "bg-gray-100 text-gray-800";
  };

  const getStatusText = (status) => {
    if (!status) return "Active"; // Default status
    const normalized = normalizeStatus(status);
    if (normalized === "completed") return "Completed";
    if (normalized === "on_hold") return "On Hold";
    if (normalized === "active") return "Active";
    if (normalized === "archived") return "Archived";
    if (normalized === "cancelled") return "Cancelled";
    if (normalized === "done") return "Completed";
    if (normalized === "in_progress") return "In Progress";
    if (normalized === "todo") return "To Do";
    return status; // Return original if not matched
  };

  const normalizeStatus = (status) => {
    return status?.toLowerCase() || "";
  };

  // Helper function to get priority badge class
  const getPriorityClass = (priority) => {
    const normalized = priority?.toLowerCase() || "";
    if (normalized === "high") return "bg-red-100 text-red-800";
    if (normalized === "medium") return "bg-yellow-100 text-yellow-800";
    return "bg-blue-100 text-blue-800";
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  if (userLoading) {
    return (
      <div className="space-y-8">
        <div className="h-8 bg-gray-200 rounded w-1/3 animate-pulse"></div>
        <div className="h-64 bg-gray-200 rounded w-full animate-pulse"></div>
        <div className="h-64 bg-gray-200 rounded w-full animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">
          Hello, {firstName}!
        </h1>
        <p className="text-gray-500">
          Here's an overview of your tasks and projects
        </p>
      </div>

      <div className="flex flex-wrap gap-4">
        <Link
          href="/dashboard/tasks/new"
          className="inline-flex items-center bg-blue-600 text-white rounded-md h-auto py-2 px-3 hover:bg-blue-700"
        >
          <Plus className="mr-2 h-4 w-4" />
          New Task
        </Link>
        <Link
          href="/dashboard/projects/new"
          className="inline-flex items-center border border-gray-300 bg-white text-gray-700 rounded-md h-auto py-2 px-3 hover:bg-gray-50"
        >
          <Plus className="mr-2 h-4 w-4" />
          New Project
        </Link>
      </div>

      {/* Recent Tasks Overview */}
      <div className="bg-white rounded-lg border shadow-sm">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Recent Tasks</h2>
          <Link
            href="/dashboard/tasks"
            className="text-blue-600 hover:text-blue-800 text-sm font-medium inline-flex items-center"
          >
            View All
            <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          {tasksLoading ? (
            <div className="p-8 text-center text-gray-500">
              <p>Loading tasks...</p>
            </div>
          ) : tasks.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p className="mb-2">No tasks found</p>
              <Link
                href="/dashboard/tasks/new"
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                Create your first task
              </Link>
            </div>
          ) : (
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border p-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Task
                  </th>
                  <th className="border p-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="border p-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="border p-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Due Date
                  </th>
                  <th className="border p-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Project
                  </th>
                  <th className="border p-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {tasks.map((task) => (
                  <tr key={task.id} className="border hover:bg-gray-50">
                    <td className="border p-2">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={task.status?.toLowerCase() === "done"}
                          onChange={() => {}}
                          className="mr-2"
                        />
                        <div>
                          <div
                            className={`font-medium ${
                              task.status?.toLowerCase() === "done"
                                ? "line-through text-gray-500"
                                : ""
                            }`}
                            onClick={() =>
                              router.push(`/dashboard/tasks/${task.id}`)
                            }
                            style={{ cursor: "pointer" }}
                          >
                            {task.title}
                          </div>
                          <div
                            className="text-sm text-gray-500 truncate"
                            style={{ maxWidth: "200px" }}
                          >
                            {task.description}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="border p-2">
                      {getStatusBadge(task.status)}
                    </td>
                    <td className="border p-2">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${getPriorityClass(
                          task.priority
                        )}`}
                      >
                        {task.priority ? task.priority.toUpperCase() : "LOW"}
                      </span>
                    </td>
                    <td className="border p-2">
                      <div className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1 text-gray-500" />
                        {formatDate(task.due_date)}
                      </div>
                    </td>
                    <td className="border p-2">{task.project?.name || "-"}</td>
                    <td className="border p-2 text-center">
                      <div className="flex justify-center space-x-2">
                        <button
                          onClick={() =>
                            router.push(`/dashboard/tasks/${task.id}`)
                          }
                          className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Recent Projects Overview */}
      <div className="bg-white rounded-lg border shadow-sm">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Recent Projects</h2>
          <Link
            href="/dashboard/projects"
            className="text-blue-600 hover:text-blue-800 text-sm font-medium inline-flex items-center"
          >
            View All
            <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          {projectsLoading ? (
            <div className="p-8 text-center text-gray-500">
              <p>Loading projects...</p>
            </div>
          ) : projects.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p className="mb-2">No projects found</p>
              <Link
                href="/dashboard/projects/new"
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                Create your first project
              </Link>
            </div>
          ) : (
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border p-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Project
                  </th>
                  <th className="border p-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="border p-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tasks
                  </th>
                  <th className="border p-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Members
                  </th>
                  <th className="border p-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created At
                  </th>
                  <th className="border p-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {projects.map((project) => (
                  <tr key={project.id} className="border hover:bg-gray-50">
                    <td className="border p-2">
                      <div>
                        <div
                          className="font-medium cursor-pointer"
                          onClick={() =>
                            router.push(`/dashboard/projects/${project.id}`)
                          }
                        >
                          {project.name}
                        </div>
                        <div
                          className="text-sm text-gray-500 truncate"
                          style={{ maxWidth: "200px" }}
                        >
                          {project.description || "No description provided"}
                        </div>
                      </div>
                    </td>
                    <td className="border p-2">
                      {getStatusBadge(project.status)}
                    </td>
                    <td className="border p-2">
                      <div className="flex items-center">
                        <CheckSquare className="h-3 w-3 mr-1 text-gray-500" />
                        <span>{project.task_count || 0}</span>
                      </div>
                    </td>
                    <td className="border p-2">
                      <div className="flex items-center">
                        <Users className="h-3 w-3 mr-1 text-gray-500" />
                        <span>{project.member_count || 0}</span>
                      </div>
                    </td>
                    <td className="border p-2">
                      <div className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1 text-gray-500" />
                        {formatDate(project.created_at)}
                      </div>
                    </td>
                    <td className="border p-2 text-center">
                      <div className="flex justify-center space-x-2">
                        <button
                          onClick={() =>
                            router.push(`/dashboard/projects/${project.id}`)
                          }
                          className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
      {/* Users Table - Only visible to admins */}
      <UsersTable />
    </div>
  );
}
