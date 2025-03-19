"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FolderKanban,
  Menu,
  User,
  LogOut,
  LayoutDashboard,
  CheckSquare,
} from "lucide-react";
import { logout } from "@/actions/auth-actions";

export default function DashboardLayout({ children }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();

  // Get user data from cookies on client side
  useEffect(() => {
    try {
      const userDataCookie = document.cookie
        .split("; ")
        .find((row) => row.startsWith("user_data="));

      if (userDataCookie) {
        const userData = JSON.parse(
          decodeURIComponent(userDataCookie.split("=")[1])
        );
        setUser(userData);
      }
    } catch (error) {
      console.error("Error parsing user data from cookie:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const routes = [
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
    },
    {
      href: "/dashboard/tasks",
      label: "Tasks",
      icon: CheckSquare,
    },
    {
      href: "/dashboard/projects",
      label: "Projects",
      icon: FolderKanban,
    },
  ];

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Error during logout:", error);
      // Fallback client-side logout
      document.cookie =
        "access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      document.cookie =
        "refresh_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      document.cookie =
        "user_data=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      window.location.href = "/login";
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header with Logo and User Menu */}
      <header className="sticky top-0 z-40 flex h-16 items-center border-b bg-white shadow-sm">
        <div className="container mx-auto py-2 px-4 md:px-6 flex items-center justify-between w-full">
          {/* Mobile Navigation Toggle */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md hover:bg-gray-100"
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </button>
          </div>

          {/* Logo */}
          <div className="flex items-center flex-shrink-0">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 font-semibold text-xl"
            >
              <span className="hidden md:inline">Task Tracking System</span>
            </Link>
          </div>

          {/* Desktop Navigation - Centered in the header */}
          <div className="hidden md:flex items-center justify-center flex-1">
            <nav className="flex space-x-4">
              {routes.map((route) => {
                const Icon = route.icon;
                const isActive = pathname === route.href;
                return (
                  <Link
                    key={route.href}
                    href={route.href}
                    className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium ${
                      isActive
                        ? "bg-blue-50 text-blue-700"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    {route.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* User Menu */}
          <div className="flex items-center gap-2">
            {loading ? (
              <UserSkeleton />
            ) : !user ? (
              <Link
                href="/login"
                className="text-sm font-medium text-blue-600 hover:underline"
              >
                Login
              </Link>
            ) : (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 rounded-full bg-gray-100 p-1.5 text-sm"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white">
                    <User className="h-4 w-4" />
                  </div>
                </button>

                {userMenuOpen && (
                  <div
                    className="absolute right-0 mt-2 w-56 rounded-md bg-white p-2 shadow-lg ring-1 ring-black ring-opacity-5"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="px-4 py-2 text-sm">
                      <p className="text-gray-500">
                        {user.email || "user@example.com"}
                      </p>
                    </div>
                    <div className="border-t border-gray-100 my-1"></div>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md flex items-center"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Navigation Menu */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 bg-black bg-opacity-50 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            className="fixed top-0 left-0 h-full w-[240px] bg-white p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-2 py-6">
              <Link
                href="/dashboard"
                className="flex items-center gap-2 font-semibold"
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="text-xl">Task Tracking System</span>
              </Link>
            </div>
            <nav className="flex flex-col gap-2 px-2">
              {routes.map((route) => {
                const Icon = route.icon;
                return (
                  <Link
                    key={route.href}
                    href={route.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium ${
                      pathname === route.href
                        ? "bg-blue-600 text-white"
                        : "hover:bg-gray-100"
                    }`}
                  >
                    {Icon && <Icon className="h-4 w-4" />}
                    {route.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 p-4">
        <div className="container mx-auto py-6 px-4 md:px-6">{children}</div>
      </main>
    </div>
  );
}

// User Skeleton Component
function UserSkeleton() {
  return (
    <div className="flex items-center gap-2">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 animate-pulse">
        <div className="h-4 w-4 rounded-full bg-gray-300"></div>
      </div>
    </div>
  );
}
