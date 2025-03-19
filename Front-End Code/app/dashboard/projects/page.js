"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  getProjects,
  deleteProject,
  updateProject,
} from "@/actions/project-actions";
import {
  Plus,
  Edit,
  Trash,
  CheckSquare,
  Calendar,
  User,
  Users,
} from "lucide-react";

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("all");

  // Fetch projects on component mount
  useEffect(() => {
    const fetchProjects = async () => {
      setIsLoading(true);
      try {
        const result = await getProjects();
        if (result.success) {
          setProjects(result.projects || []);
        } else {
          setError(result.message || "Failed to fetch projects");
        }
      } catch (error) {
        setError("Error loading projects. Please try again.");
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjects();
  }, []);

  // Helper function to normalize status for comparison
  const normalizeStatus = (status) => {
    return status?.toLowerCase() || "";
  };

  // Get filter value from tab
  const getFilterFromTab = (tab) => {
    switch (tab) {
      case "active":
        return "active";
      case "on-hold":
        return "on_hold";
      case "completed":
        return "completed";
      case "archived":
        return "archived";
      case "cancelled":
        return "cancelled";
      default:
        return null;
    }
  };

  // Handle project deletion
  const handleDelete = async (id, e) => {
    e.preventDefault();
    if (confirm("Are you sure you want to delete this project?")) {
      try {
        const result = await deleteProject(id);
        if (result.success) {
          setProjects(projects.filter((project) => project.id !== id));
          alert("Project deleted successfully");
        } else {
          alert(result.message || "Failed to delete project");
        }
      } catch (error) {
        alert("Failed to delete project. Please try again.");
        console.error(error);
      }
    }
  };

  // Handle status change
  const handleStatusChange = async (id, newStatus, e) => {
    e.preventDefault();
    try {
      const result = await updateProject(id, { status: newStatus });
      if (result.success) {
        if (
          activeTab !== "all" &&
          normalizeStatus(newStatus) !==
            normalizeStatus(getFilterFromTab(activeTab))
        ) {
          setProjects(projects.filter((project) => project.id !== id));
        } else {
          setProjects(
            projects.map((project) =>
              project.id === id ? { ...project, status: newStatus } : project
            )
          );
        }
      } else {
        alert(result.message || "Failed to update project status");
      }
    } catch (error) {
      alert("Failed to update project status. Please try again.");
    }
  };

  // Filter projects based on active tab
  const filteredProjects = projects.filter((project) => {
    if (activeTab !== "all") {
      const filterStatus = getFilterFromTab(activeTab);
      return normalizeStatus(project.status) === normalizeStatus(filterStatus);
    }
    return true;
  });

  // Get status badge class
  const getStatusClass = (status) => {
    const normalized = normalizeStatus(status);
    if (normalized === "completed") return "bg-green-100 text-green-800";
    if (normalized === "active") return "bg-blue-100 text-blue-800";
    if (normalized === "on_hold") return "bg-yellow-100 text-yellow-800";
    if (normalized === "archived") return "bg-gray-100 text-gray-800";
    if (normalized === "cancelled") return "bg-red-100 text-red-800";
    return "bg-gray-100 text-gray-800";
  };

  // Get status text
  const getStatusText = (status) => {
    if (!status) return "Active"; // Default status
    const normalized = normalizeStatus(status);
    if (normalized === "completed") return "Completed";
    if (normalized === "on_hold") return "On Hold";
    if (normalized === "active") return "Active";
    if (normalized === "archived") return "Archived";
    if (normalized === "cancelled") return "Cancelled";
    return status; // Return original if not matched
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Navigate to project edit page
  const navigateToProject = (id) => {
    router.push(`/dashboard/projects/${id}`);
  };

  return (
    <div className="container mx-auto p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">Projects</h1>
        <Link
          href="/dashboard/projects/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          <Plus className="inline-block mr-1 h-4 w-4" /> New Project
        </Link>
      </div>

      {/* Tabs */}
      <div className="mb-4 border-b overflow-none">
        <ul className="flex flex-wrap -mb-px whitespace-nowrap">
          <li className="mr-2">
            <button
              onClick={() => setActiveTab("all")}
              className={`inline-block p-4 ${
                activeTab === "all"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              All
            </button>
          </li>
          <li className="mr-2">
            <button
              onClick={() => setActiveTab("active")}
              className={`inline-block p-4 ${
                activeTab === "active"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Active
            </button>
          </li>
          <li className="mr-2">
            <button
              onClick={() => setActiveTab("on-hold")}
              className={`inline-block p-4 ${
                activeTab === "on-hold"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              On Hold
            </button>
          </li>
          <li className="mr-2">
            <button
              onClick={() => setActiveTab("completed")}
              className={`inline-block p-4 ${
                activeTab === "completed"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Completed
            </button>
          </li>
          <li className="mr-2">
            <button
              onClick={() => setActiveTab("archived")}
              className={`inline-block p-4 ${
                activeTab === "archived"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Archived
            </button>
          </li>
          <li>
            <button
              onClick={() => setActiveTab("cancelled")}
              className={`inline-block p-4 ${
                activeTab === "cancelled"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Cancelled
            </button>
          </li>
        </ul>
      </div>

      {/* Project Table */}
      {isLoading ? (
        <div className="text-center p-4">Loading projects...</div>
      ) : error ? (
        <div className="text-center p-4 text-red-500">{error}</div>
      ) : filteredProjects.length === 0 ? (
        <div className="text-center p-4">
          <p className="mb-4">No projects found</p>
          <Link
            href="/dashboard/projects/new"
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Create Project
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2 text-left">Project</th>
                <th className="border p-2 text-left">Status</th>
                <th className="border p-2 text-left">Tasks</th>
                <th className="border p-2 text-left">Members</th>
                <th className="border p-2 text-left">Created At</th>
                <th className="border p-2 text-left">Created By</th>
                <th className="border p-2 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProjects.map((project) => (
                <tr
                  key={project.id}
                  className={`border hover:bg-gray-50 ${
                    normalizeStatus(project.status) === "completed"
                      ? "bg-gray-50"
                      : ""
                  }`}
                >
                  <td className="border p-2">
                    <div>
                      <div
                        className="font-medium cursor-pointer"
                        onClick={() => navigateToProject(project.id)}
                      >
                        {project.name}
                      </div>
                      <div
                        className="text-sm text-gray-500 truncate"
                        style={{ maxWidth: "300px" }}
                      >
                        {project.description || "No description provided"}
                      </div>
                    </div>
                  </td>
                  <td className="border p-2">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${getStatusClass(
                        project.status
                      )}`}
                    >
                      {getStatusText(project.status)}
                    </span>
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
                  <td className="border p-2">
                    <div className="flex items-center">
                      <User className="h-3 w-3 mr-1 text-gray-500" />
                      {project.created_by_username ||
                        (project.created_by && project.created_by.username) ||
                        "-"}
                    </div>
                  </td>
                  <td className="border p-2 text-center">
                    <div className="flex justify-center space-x-2">
                      <button
                        onClick={() => navigateToProject(project.id)}
                        className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={(e) => handleDelete(project.id, e)}
                        className="p-1 text-red-600 hover:bg-red-100 rounded"
                        title="Delete"
                      >
                        <Trash className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
