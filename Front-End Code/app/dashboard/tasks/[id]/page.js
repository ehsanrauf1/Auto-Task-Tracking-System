"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getTask, updateTask } from "@/actions/task-actions";
import { getProjects } from "@/actions/project-actions";
import Link from "next/link";

export default function TaskEditPage({ params }) {
  const router = useRouter();
  const taskId = Number.parseInt(params.id, 10);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [projects, setProjects] = useState([]);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: "TODO",
    priority: "MEDIUM",
    due_date: "",
    project_id: "",
  });
  const [errors, setErrors] = useState({});

  // Fetch task and projects data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch task data
        const taskResult = await getTask(taskId);

        if (!taskResult.success || !taskResult.task) {
          setError("Task not found");
          setIsLoading(false);
          return;
        }

        // Fetch projects for dropdown
        const projectsResult = await getProjects();
        if (projectsResult.success) {
          setProjects(projectsResult.projects || []);
        }

        // Format the task data for the form
        const task = taskResult.task;
        setFormData({
          title: task.title || "",
          description: task.description || "",
          status: task.status || "TODO",
          priority: task.priority || "MEDIUM",
          due_date: formatDateForInput(new Date(task.due_date)),
          project_id: task.project?.id || "",
        });
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Failed to load task data");
      } finally {
        setIsLoading(false);
      }
    };

    if (isNaN(taskId)) {
      setError("Invalid task ID");
      setIsLoading(false);
    } else {
      fetchData();
    }
  }, [taskId]);

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

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    }

    if (!formData.due_date) {
      newErrors.due_date = "Due date is required";
    }

    if (!formData.project_id) {
      newErrors.project_id = "Project is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSaving(true);

    try {
      const result = await updateTask(taskId, formData);

      if (result.success) {
        alert("Task updated successfully!");
        router.push("/dashboard/tasks");
      } else {
        alert(result.message || "Failed to update task");
        setIsSaving(false);
      }
    } catch (error) {
      console.error("Error updating task:", error);
      alert("An error occurred while updating the task");
      setIsSaving(false);
    }
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
            <TaskFormSkeleton />
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
            Unable to load the task information
          </p>
          <Link
            href="/dashboard/tasks"
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            Back to Tasks
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white border rounded-lg shadow-sm">
        <div className="p-6 border-b">
          <h1 className="text-xl font-semibold">Edit Task</h1>
          <p className="text-sm text-gray-500">
            Update the details of your task
          </p>
        </div>
        <div className="p-6">
          <TaskForm
            formData={formData}
            handleChange={handleChange}
            handleSubmit={handleSubmit}
            errors={errors}
            isLoading={isSaving}
            projects={projects}
            isEditing={true}
          />
        </div>
      </div>
    </div>
  );
}

// Helper component for the task form
function TaskForm({
  formData,
  handleChange,
  handleSubmit,
  errors,
  isLoading,
  projects,
  isEditing = false,
}) {
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <label
          htmlFor="title"
          className="block text-sm font-medium text-gray-700"
        >
          Title <span className="text-red-500">*</span>
        </label>
        <input
          id="title"
          name="title"
          type="text"
          value={formData.title}
          onChange={handleChange}
          disabled={isLoading}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Task title"
        />
        {errors.title && <p className="text-sm text-red-500">{errors.title}</p>}
      </div>

      <div className="space-y-2">
        <label
          htmlFor="description"
          className="block text-sm font-medium text-gray-700"
        >
          Description <span className="text-red-500">*</span>
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          disabled={isLoading}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Task description"
        />
        {errors.description && (
          <p className="text-sm text-red-500">{errors.description}</p>
        )}
      </div>

      <div className="space-y-2">
        <label
          htmlFor="project_id"
          className="block text-sm font-medium text-gray-700"
        >
          Project <span className="text-red-500">*</span>
        </label>
        <select
          id="project_id"
          name="project_id"
          value={formData.project_id}
          onChange={handleChange}
          disabled={isLoading}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select a project</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
        {errors.project_id && (
          <p className="text-sm text-red-500">{errors.project_id}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            disabled={isLoading}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="TODO">To Do</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="DONE">Done</option>
          </select>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="priority"
            className="block text-sm font-medium text-gray-700"
          >
            Priority
          </label>
          <select
            id="priority"
            name="priority"
            value={formData.priority}
            onChange={handleChange}
            disabled={isLoading}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <label
          htmlFor="due_date"
          className="block text-sm font-medium text-gray-700"
        >
          Due Date <span className="text-red-500">*</span>
        </label>
        <input
          id="due_date"
          name="due_date"
          type="date"
          value={formData.due_date}
          onChange={handleChange}
          disabled={isLoading}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {errors.due_date && (
          <p className="text-sm text-red-500">{errors.due_date}</p>
        )}
      </div>

      <div className="flex justify-end space-x-4 pt-4">
        <Link
          href="/dashboard/tasks"
          className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium bg-white text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {isLoading ? "Saving..." : isEditing ? "Update Task" : "Create Task"}
        </button>
      </div>
    </form>
  );
}

// Skeleton loader for the form
function TaskFormSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
        <div className="h-10 bg-gray-200 rounded w-full animate-pulse"></div>
      </div>

      <div className="space-y-2">
        <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
        <div className="h-32 bg-gray-200 rounded w-full animate-pulse"></div>
      </div>

      <div className="space-y-2">
        <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
        <div className="h-10 bg-gray-200 rounded w-full animate-pulse"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
          <div className="h-10 bg-gray-200 rounded w-full animate-pulse"></div>
        </div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
          <div className="h-10 bg-gray-200 rounded w-full animate-pulse"></div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
        <div className="h-10 bg-gray-200 rounded w-full animate-pulse"></div>
      </div>

      <div className="flex justify-end space-x-4">
        <div className="h-10 bg-gray-200 rounded w-24 animate-pulse"></div>
        <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
      </div>
    </div>
  );
}

// Helper function to format date for input field
function formatDateForInput(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
