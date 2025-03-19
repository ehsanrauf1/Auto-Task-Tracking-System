"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getProject, updateProject } from "@/actions/project-actions";


export default function EditProjectPage({ params }) {
  const router = useRouter();
  const projectId = Number.parseInt(params.id, 10);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    status: "active",
  });
  const [errors, setErrors] = useState({});

  // Project status options
  const statusOptions = [
    { value: "active", label: "Active" },
    { value: "on_hold", label: "On Hold" },
    { value: "completed", label: "Completed" },
    { value: "archived", label: "Archived" },
    { value: "cancelled", label: "Cancelled" },
  ];

  // Fetch project data
  useEffect(() => {
    const fetchProject = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await getProject(projectId);

        if (!result.success || !result.project) {
          setError("Project not found");
          setIsLoading(false);
          return;
        }

        // Format the project data for the form
        const project = result.project;
        setFormData({
          name: project.name || "",
          description: project.description || "",
          status: project.status || "active",
        });
      } catch (error) {
        console.error("Error fetching project:", error);
        setError("Failed to load project data");
      } finally {
        setIsLoading(false);
      }
    };

    if (isNaN(projectId)) {
      setError("Invalid project ID");
      setIsLoading(false);
    } else {
      fetchProject();
    }
  }, [projectId]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Project name is required";
    } else if (formData.name.trim().length < 3) {
      newErrors.name = "Project name must be at least 3 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when field is edited
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: null,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSaving(true);

    try {
      const result = await updateProject(projectId, formData);

      if (result.success) {
        alert("Project updated successfully!");
        router.push("/dashboard/projects");
      } else {
        alert(result.message || "Failed to update project");
        setIsSaving(false);
      }
    } catch (error) {
      console.error("Error updating project:", error);
      alert("An error occurred while updating the project");
      setIsSaving(false);
    }
  };

  // Get status badge class
  const getStatusClass = (status) => {
    const normalized = status?.toLowerCase() || "";
    if (normalized === "completed") return "bg-success";
    if (normalized === "active") return "bg-primary";
    if (normalized === "on_hold") return "bg-warning";
    if (normalized === "archived") return "bg-secondary";
    if (normalized === "cancelled") return "bg-danger";
    return "bg-secondary";
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white border rounded-lg shadow-sm">
          <div className="p-6 border-b">
            <div className="h-6 bg-gray-200 rounded w-1/4 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mt-2 animate-pulse"></div>
          </div>
          <div className="p-6">
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
                <div className="h-10 bg-gray-200 rounded w-full animate-pulse"></div>
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                <div className="h-32 bg-gray-200 rounded w-full animate-pulse"></div>
              </div>
              <div className="flex justify-end space-x-4">
                <div className="h-10 bg-gray-200 rounded w-24 animate-pulse"></div>
                <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white border rounded-lg shadow-sm p-6 text-center">
          <div className="text-red-500 text-lg font-medium mb-2">{error}</div>
          <p className="text-gray-500 mb-4">
            Unable to load the project information
          </p>
          <Link
            href="/dashboard/projects"
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            Back to Projects
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white border rounded-lg shadow-sm">
        <div className="p-6 border-b">
          <h1 className="text-xl font-semibold">Edit Project</h1>
          <p className="text-sm text-gray-500">Update your project details</p>
        </div>
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700"
              >
                Project Name <span className="text-red-500">*</span>
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                disabled={isSaving}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter project name"
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <label
                htmlFor="status"
                className="block text-sm font-medium text-gray-700"
              >
                Status
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                disabled={isSaving}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="active">Active</option>
                <option value="on_hold">On Hold</option>
                <option value="completed">Completed</option>
                <option value="archived">Archived</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700"
              >
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                disabled={isSaving}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Describe the purpose of this project"
              />
            </div>

            <div className="flex justify-end space-x-4 pt-4">
              <Link
                href="/dashboard/projects"
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium bg-white text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isSaving}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {isSaving ? "Saving..." : "Update Project"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
