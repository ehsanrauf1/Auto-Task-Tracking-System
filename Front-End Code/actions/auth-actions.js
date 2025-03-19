"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

// Get the auth token from cookies
async function getAuthToken() {
  const cookieStore = await cookies();
  return cookieStore.get("access_token")?.value;
}

// Set authentication cookies
export async function setAuthCookies(accessToken, refreshToken, userData) {
  const cookieStore = await cookies();

  // Set access token cookie (HTTP-only for security)
  cookieStore.set({
    name: "access_token",
    value: accessToken,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
    sameSite: "strict",
  });

  // Set refresh token cookie (HTTP-only for security)
  cookieStore.set({
    name: "refresh_token",
    value: refreshToken,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
    sameSite: "strict",
  });

  // Set user data in a cookie (not HTTP-only as we need to access it client-side)
  cookieStore.set({
    name: "user_data",
    value: JSON.stringify(userData),
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
    sameSite: "strict",
  });

  return { success: true };
}

// Login function
export async function login(email, password) {
  try {
    const response = await fetch(`${process.env.API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        message: errorData.error || "Login failed",
      };
    }

    const data = await response.json();

    // Create a user object from the token data
    const userInfo = {
      id: data.user?.id || 0,
      username: data.user?.username || "",
      email: email,
      first_name: data.user?.first_name || "",
      last_name: data.user?.last_name || "",
      role: data.user?.role || "user",
    };

    // Save tokens and user data in cookies
    await setAuthCookies(data.access_token, data.refresh_token, userInfo);

    return {
      success: true,
      user: userInfo,
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}

// Register function
export async function register(
  username,
  email,
  password,
  password_confirm,
  first_name,
  last_name
) {
  try {
    const response = await fetch(`${process.env.API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username,
        email,
        password,
        password_confirm,
        first_name,
        last_name,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        message: errorData.detail || "Registration failed",
      };
    }

    return {
      success: true,
      message: "Registration successful. Please log in with your new account.",
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}

// Logout function
export async function logout() {
  const cookieStore = await cookies();

  cookieStore.delete("access_token");
  cookieStore.delete("refresh_token");
  cookieStore.delete("user_data");

  redirect("/login");
}

// Get user from cookies
export async function getUserFromCookies() {
  const cookieStore = await cookies();
  const userDataCookie = cookieStore.get("user_data");
  const accessTokenCookie = cookieStore.get("access_token");

  if (!userDataCookie || !accessTokenCookie) {
    return { user: null, token: null };
  }

  try {
    const userData = JSON.parse(userDataCookie.value);
    return {
      user: userData,
      token: accessTokenCookie.value,
    };
  } catch (error) {
    return { user: null, token: null };
  }
}

// Refresh token
export async function refreshToken() {
  const cookieStore = await cookies();
  const refreshTokenCookie = cookieStore.get("refresh_token");

  if (!refreshTokenCookie) {
    return { success: false };
  }

  try {
    const response = await fetch(`${process.env.API_BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refresh_token: refreshTokenCookie.value }),
    });

    if (!response.ok) {
      return { success: false };
    }

    const data = await response.json();

    // Update the access token cookie
    cookieStore.set({
      name: "access_token",
      value: data.access_token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
      sameSite: "strict",
    });

    return { success: true };
  } catch (error) {
    return { success: false };
  }
}

// Clear auth cookies
export async function clearAuthCookies() {
  const cookieStore = await cookies();

  cookieStore.delete("access_token");
  cookieStore.delete("refresh_token");
  cookieStore.delete("user_data");

  return { success: true };
}

export async function getAllUsers() {
  const token = await getAuthToken();

  if (!token) {
    return { success: false, message: "Not authenticated" };
  }

  try {
    const response = await fetch(`${process.env.API_BASE_URL}/auth/users`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      if (response.status === 403) {
        return {
          success: false,
          message: "Admin privileges required",
          isAdminError: true,
        };
      }
      return { success: false, message: "Failed to fetch users" };
    }

    const users = await response.json();
    return { success: true, users };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}
