"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getTasks, updateTask, deleteTask } from "@/actions/task-actions";
import { Plus, Edit, Trash, User, Calendar } from "lucide-react";

export default function TasksPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("all");

  // Fetch tasks on component mount
  useEffect(() => {
    const fetchTasks = async () => {
      setIsLoading(true);
      try {
        const result = await getTasks();
        if (result.success) {
          setTasks(result.tasks || []);
        } else {
          setError(result.message || "Failed to fetch tasks");
        }
      } catch (error) {
        setError("Error loading tasks. Please try again.");
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTasks();
  }, []);

  // Helper function to normalize status for comparison
  const normalizeStatus = (status) => {
    return status?.toLowerCase() || "";
  };

  // Get filter value from tab
  const getFilterFromTab = (tab) => {
    switch (tab) {
      case "todo":
        return "TODO";
      case "in-progress":
        return "IN_PROGRESS";
      case "done":
        return "DONE";
      default:
        return null;
    }
  };

  // Handle task deletion
  const handleDelete = async (id, e) => {
    e.preventDefault();
    if (confirm("Are you sure you want to delete this task?")) {
      try {
        const result = await deleteTask(id);
        if (result.success) {
          setTasks(tasks.filter((task) => task.id !== id));
        } else {
          alert(result.message || "Failed to delete task");
        }
      } catch (error) {
        alert("Failed to delete task. Please try again.");
      }
    }
  };

  // Handle status change
  const handleStatusChange = async (id, newStatus, e) => {
    e.preventDefault();
    try {
      const result = await updateTask(id, { status: newStatus });
      if (result.success) {
        if (
          activeTab !== "all" &&
          normalizeStatus(newStatus) !==
            normalizeStatus(getFilterFromTab(activeTab))
        ) {
          setTasks(tasks.filter((task) => task.id !== id));
        } else {
          setTasks(
            tasks.map((task) =>
              task.id === id ? { ...task, status: newStatus } : task
            )
          );
        }
      } else {
        alert(result.message || "Failed to update task status");
      }
    } catch (error) {
      alert("Failed to update task status. Please try again.");
    }
  };

  // Filter tasks based on active tab
  const filteredTasks = tasks.filter((task) => {
    if (activeTab !== "all") {
      const filterStatus = getFilterFromTab(activeTab);
      return normalizeStatus(task.status) === normalizeStatus(filterStatus);
    }
    return true;
  });

  // Get status badge class
  const getStatusClass = (status) => {
    const normalized = normalizeStatus(status);
    if (normalized === "done") return "bg-success";
    if (normalized === "in_progress") return "bg-primary";
    return "bg-warning";
  };

  // Get status text
  const getStatusText = (status) => {
    const normalized = normalizeStatus(status);
    if (normalized === "done") return "Completed";
    if (normalized === "in_progress") return "In Progress";
    return "To Do";
  };

  // Get priority badge class
  const getPriorityClass = (priority) => {
    const normalized = normalizeStatus(priority);
    if (normalized === "high") return "bg-danger";
    if (normalized === "medium") return "bg-warning";
    return "bg-info";
  };

  // Format due date
  const formatDueDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  // Format created date
  const formatCreatedDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Navigate to task edit page
  const navigateToTask = (id) => {
    router.push(`/dashboard/tasks/${id}`);
  };

  return (
    <div className="container mx-auto p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">Tasks</h1>
        <Link
          href="/dashboard/tasks/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          <Plus className="inline-block mr-1 h-4 w-4" /> New Task
        </Link>
      </div>

      {/* Tabs */}
      <div className="mb-4 border-b">
        <ul className="flex flex-wrap -mb-px">
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
              onClick={() => setActiveTab("todo")}
              className={`inline-block p-4 ${
                activeTab === "todo"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              To Do
            </button>
          </li>
          <li className="mr-2">
            <button
              onClick={() => setActiveTab("in-progress")}
              className={`inline-block p-4 ${
                activeTab === "in-progress"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              In Progress
            </button>
          </li>
          <li>
            <button
              onClick={() => setActiveTab("done")}
              className={`inline-block p-4 ${
                activeTab === "done"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Done
            </button>
          </li>
        </ul>
      </div>

      {/* Task Table */}
      {isLoading ? (
        <div className="text-center p-4">Loading tasks...</div>
      ) : error ? (
        <div className="text-center p-4 text-red-500">{error}</div>
      ) : filteredTasks.length === 0 ? (
        <div className="text-center p-4">
          <p className="mb-4">No tasks found</p>
          <Link
            href="/dashboard/tasks/new"
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Create Task
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2 text-left">Task</th>
                <th className="border p-2 text-left">Status</th>
                <th className="border p-2 text-left">Priority</th>
                <th className="border p-2 text-left">Due Date</th>
                <th className="border p-2 text-left">Project</th>
                <th className="border p-2 text-left">Assigned To</th>
                <th className="border p-2 text-left">Created By</th>
                <th className="border p-2 text-left">Created At</th>
                <th className="border p-2 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.map((task) => (
                <tr
                  key={task.id}
                  className={`border hover:bg-gray-50 ${
                    normalizeStatus(task.status) === "done" ? "bg-gray-50" : ""
                  }`}
                >
                  <td className="border p-2">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={normalizeStatus(task.status) === "done"}
                        onChange={(e) =>
                          handleStatusChange(
                            task.id,
                            normalizeStatus(task.status) === "done"
                              ? "TODO"
                              : "DONE",
                            e
                          )
                        }
                        className="mr-2"
                      />
                      <div>
                        <div
                          className={`font-medium ${
                            normalizeStatus(task.status) === "done"
                              ? "line-through text-gray-500"
                              : ""
                          }`}
                          onClick={() => navigateToTask(task.id)}
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
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${getStatusClass(
                        task.status
                      )}`}
                    >
                      {getStatusText(task.status)}
                    </span>
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
                      {formatDueDate(task.due_date)}
                    </div>
                  </td>
                  <td className="border p-2">{task.project?.name || "-"}</td>
                  <td className="border p-2">
                    {task.assigned_to ? (
                      <div className="flex items-center">
                        <User className="h-3 w-3 mr-1 text-gray-500" />
                        {task.assigned_to.username}
                      </div>
                    ) : (
                      <span className="text-gray-400">Unassigned</span>
                    )}
                  </td>
                  <td className="border p-2">
                    {task.created_by ? (
                      <div className="flex items-center">
                        <User className="h-3 w-3 mr-1 text-gray-500" />
                        {task.created_by.username}
                      </div>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="border p-2">
                    {formatCreatedDate(task.created_at)}
                  </td>
                  <td className="border p-2 text-center">
                    <div className="flex justify-center space-x-2">
                      <button
                        onClick={() => navigateToTask(task.id)}
                        className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={(e) => handleDelete(task.id, e)}
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
