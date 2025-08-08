"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../../hooks/use-auth"

interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: string
  isActive: boolean
  employeeId?: string
  maxDiscountAllowed: number
  canSellBelowMin: boolean
  createdAt: string
}

export default function AdminUserManagement() {
  const { user: currentUser, isAuthenticated } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Only allow admin users to access this component
  if (!isAuthenticated || currentUser?.role !== 'admin') {
    return <div className="p-4 text-red-600">Access denied. Admin privileges required.</div>
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users')
      if (response.ok) {
        const userData = await response.json()
        setUsers(userData)
      } else {
        setError('Failed to fetch users')
      }
    } catch (err) {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole }),
      })

      if (response.ok) {
        // Refresh users list
        fetchUsers()
      } else {
        setError('Failed to update user role')
      }
    } catch (err) {
      setError('Network error')
    }
  }

  const toggleUserActive = async (userId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive }),
      })

      if (response.ok) {
        fetchUsers()
      } else {
        setError('Failed to update user status')
      }
    } catch (err) {
      setError('Network error')
    }
  }

  const updateDiscountPermissions = async (
    userId: string, 
    maxDiscountAllowed: number, 
    canSellBelowMin: boolean
  ) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ maxDiscountAllowed, canSellBelowMin }),
      })

      if (response.ok) {
        fetchUsers()
      } else {
        setError('Failed to update discount permissions')
      }
    } catch (err) {
      setError('Network error')
    }
  }

  if (loading) return <div className="p-4">Loading users...</div>
  if (error) return <div className="p-4 text-red-600">Error: {error}</div>

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">User Management</h1>
      
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Discount %</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Below Min</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {user.firstName} {user.lastName}
                    </div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                    {user.employeeId && (
                      <div className="text-xs text-gray-400">ID: {user.employeeId}</div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <select
                    value={user.role}
                    onChange={(e) => updateUserRole(user.id, e.target.value)}
                    className="text-sm border rounded px-2 py-1"
                  >
                    <option value="cashier">Cashier</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                    <option value="viewer">Viewer</option>
                  </select>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => toggleUserActive(user.id, !user.isActive)}
                    className={`px-2 py-1 text-xs rounded ${
                      user.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {user.isActive ? 'Active' : 'Inactive'}
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    type="number"
                    value={user.maxDiscountAllowed}
                    onChange={(e) => 
                      updateDiscountPermissions(
                        user.id, 
                        parseFloat(e.target.value), 
                        user.canSellBelowMin
                      )
                    }
                    className="w-16 text-sm border rounded px-2 py-1"
                    min="0"
                    max="100"
                    step="0.1"
                  />
                  %
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={user.canSellBelowMin}
                    onChange={(e) =>
                      updateDiscountPermissions(
                        user.id,
                        user.maxDiscountAllowed,
                        e.target.checked
                      )
                    }
                    className="h-4 w-4 text-blue-600"
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <button
                    onClick={() => toggleUserActive(user.id, !user.isActive)}
                    className={`px-3 py-1 rounded text-xs ${
                      user.isActive
                        ? 'bg-red-100 text-red-700 hover:bg-red-200'
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}
                  >
                    {user.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
