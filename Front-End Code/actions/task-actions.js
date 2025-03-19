"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

// Helper function to get the auth token
async function getAuthToken() {
  const cookieStore = await cookies();
  return cookieStore.get("access_token")?.value;
}

export async function getTasks() {
  const token = await getAuthToken();

  if (!token) {
    return { success: false, message: "Not authenticated" };
  }

  try {
    const response = await fetch(`${process.env.API_BASE_URL}/tasks`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      return { success: false, message: "Failed to fetch tasks" };
    }

    const data = await response.json();
    // Handle the case where the API returns an object with tasks and count properties
    const tasks = Array.isArray(data) ? data : data.tasks || [];
    return { success: true, tasks };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}

export async function getTask(id) {
  const token = await getAuthToken();

  if (!token) {
    return { success: false, message: "Not authenticated" };
  }

  try {
    const response = await fetch(`${process.env.API_BASE_URL}/tasks/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      return { success: false, message: "Failed to fetch task" };
    }

    const task = await response.json();
    return { success: true, task };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}

export async function createTask(taskData) {
  const token = await getAuthToken();

  if (!token) {
    return { success: false, message: "Not authenticated" };
  }

  try {
    const response = await fetch(`${process.env.API_BASE_URL}/tasks/`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(taskData),
    });

    if (!response.ok) {
      return { success: false, message: "Failed to create task" };
    }

    const task = await response.json();
    revalidatePath("/dashboard/tasks");
    revalidatePath("/dashboard");
    return { success: true, task };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}

export async function updateTask(id, taskData) {
  const token = await getAuthToken();

  if (!token) {
    return { success: false, message: "Not authenticated" };
  }

  try {
    const response = await fetch(`${process.env.API_BASE_URL}/tasks/${id}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(taskData),
    });

    if (!response.ok) {
      return { success: false, message: "Failed to update task" };
    }

    const task = await response.json();
    revalidatePath("/dashboard/tasks");
    revalidatePath(`/dashboard/tasks/${id}`);
    revalidatePath("/dashboard");
    return { success: true, task };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}

export async function deleteTask(id) {
  const token = await getAuthToken();

  if (!token) {
    return { success: false, message: "Not authenticated" };
  }

  try {
    const response = await fetch(`${process.env.API_BASE_URL}/tasks/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      return { success: false, message: "Failed to delete task" };
    }

    revalidatePath("/dashboard/tasks");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}

export async function getTaskStats() {
  const token = await getAuthToken();

  if (!token) {
    return {
      total: 0,
      completed: 0,
      inProgress: 0,
      overdue: 0,
      todo: 0,
    };
  }

  try {
    const response = await fetch(`${process.env.API_BASE_URL}/tasks/stats`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch task stats");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching task stats:", error);
    return {
      total: 0,
      completed: 0,
      inProgress: 0,
      overdue: 0,
      todo: 0,
    };
  }
}

export async function getRecentTasks() {
  const token = await getAuthToken();

  if (!token) {
    return [];
  }

  try {
    const response = await fetch(`${process.env.API_BASE_URL}/tasks/recent`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch recent tasks");
    }

    const data = await response.json();
    // Handle the case where the API returns an object with tasks property
    return Array.isArray(data) ? data : data.tasks || [];
  } catch (error) {
    console.error("Error fetching recent tasks:", error);
    return [];
  }
}

export async function updateTaskStatus(id, status) {
  const token = await getAuthToken();

  if (!token) {
    return { success: false, message: "Not authenticated" };
  }

  try {
    const response = await fetch(`${process.env.API_BASE_URL}/tasks/${id}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      return { success: false, message: "Failed to update task status" };
    }

    const task = await response.json();
    revalidatePath("/dashboard/tasks");
    return { success: true, task };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}
