"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createTask } from "@/actions/task-actions";
import { getProjects } from "@/actions/project-actions";
import Link from "next/link";

export default function NewTaskPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [projects, setProjects] = useState([]);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: "TODO",
    priority: "MEDIUM",
    due_date: formatDateForInput(addDays(new Date(), 7)),
    project_id: "",
  });
  const [errors, setErrors] = useState({});

  // Fetch projects for the dropdown
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const result = await getProjects();
        if (result.success) {
          setProjects(result.projects || []);
          // Set default project if available
          if (result.projects && result.projects.length > 0) {
            setFormData((prev) => ({
              ...prev,
              project_id: result.projects[0].id,
            }));
          }
        }
      } catch (error) {
        console.error("Error fetching projects:", error);
      }
    };

    fetchProjects();
  }, []);

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

    setIsLoading(true);

    try {
      const result = await createTask(formData);

      if (result.success) {
        alert("Task created successfully!");
        router.push("/dashboard/tasks");
      } else {
        alert(result.message || "Failed to create task");
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Error creating task:", error);
      alert("An error occurred while creating the task");
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white border rounded-lg shadow-sm">
        <div className="p-6 border-b">
          <h1 className="text-xl font-semibold">Create New Task</h1>
          <p className="text-sm text-gray-500">
            Add a new task to your projects
          </p>
        </div>
        <div className="p-6">
          <TaskForm
            formData={formData}
            handleChange={handleChange}
            handleSubmit={handleSubmit}
            errors={errors}
            isLoading={isLoading}
            projects={projects}
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
          {isLoading ? "Creating..." : "Create Task"}
        </button>
      </div>
    </form>
  );
}

// Helper function to add days to a date
function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

// Helper function to format date for input field
function formatDateForInput(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
