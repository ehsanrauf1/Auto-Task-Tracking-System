"use client";

import { useState, useEffect } from "react";
import { getAllUsers } from "@/actions/auth-actions";
import { User, Mail, Calendar } from "lucide-react";

export default function UsersTable() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAdminError, setIsAdminError] = useState(false);

  useEffect(() => {
    async function fetchUsers() {
      try {
        const result = await getAllUsers();

        if (result.success) {
          setUsers(result.users);
        } else if (result.isAdminError) {
          // If it's an admin privileges error, we'll just set isAdminError to true
          // and not show any error message
          setIsAdminError(true);
        } else {
          setError(result.message);
        }
      } catch (err) {
        setError("Failed to fetch users");
      } finally {
        setLoading(false);
      }
    }

    fetchUsers();
  }, []);

  // If there's an admin privileges error, return null (show nothing)
  if (isAdminError) {
    return null;
  }

  // If still loading, show a loading indicator
  if (loading) {
    return (
      <div className="bg-white rounded-lg border shadow-sm p-4 mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Users</h2>
        </div>
        <div className="text-center py-8">Loading users...</div>
      </div>
    );
  }

  // If there's an error (other than admin privileges), show the error
  if (error) {
    return (
      <div className="bg-white rounded-lg border shadow-sm p-4 mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Users</h2>
        </div>
        <div className="text-center py-8 text-red-500">{error}</div>
      </div>
    );
  }

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

  return (
    <div className="bg-white rounded-lg border shadow-sm mt-8">
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-semibold">System Users</h2>
        <div className="text-sm text-gray-500">{users.length} users</div>
      </div>

      <div className="overflow-x-auto">
        {users.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p>No users found</p>
          </div>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="border p-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="border p-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="border p-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="border p-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Joined
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="border hover:bg-gray-50">
                  <td className="border p-2">
                    <div className="flex items-center">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600 mr-3">
                        <User className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-medium">
                          {user.first_name} {user.last_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          @{user.username}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="border p-2">
                    <div className="flex items-center">
                      <Mail className="h-3 w-3 mr-1 text-gray-500" />
                      {user.email}
                    </div>
                  </td>
                  <td className="border p-2">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        user.role === "admin"
                          ? "bg-purple-100 text-purple-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {user.role === "admin"
                        ? "Administrator"
                        : "Standard User"}
                    </span>
                  </td>
                  <td className="border p-2">
                    <div className="flex items-center">
                      <Calendar className="h-3 w-3 mr-1 text-gray-500" />
                      {formatDate(user.date_joined)}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
