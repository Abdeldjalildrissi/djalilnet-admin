"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useSession } from "@/lib/auth-client"
import { 
  UserPlus, 
  MoreHorizontal, 
  Shield, 
  User as UserIcon, 
  CheckCircle2, 
  XCircle,
  Mail,
  Calendar
} from "lucide-react"
import { useState } from "react"
import { formatRelativeTime } from "@/lib/utils"

interface User {
  id: string
  name: string
  email: string
  role: string
  isActive: boolean
  createdAt: string
}

export default function UsersPage() {
  const { data: session } = useSession()
  const queryClient = useQueryClient()
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ["users"],
    queryFn: async () => {
      const res = await fetch("/api/users")
      if (!res.ok) throw new Error("Failed to fetch users")
      return res.json()
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, role, isActive }: { id: string, role?: string, isActive?: boolean }) => {
      const res = await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, role, isActive }),
      })
      if (!res.ok) throw new Error("Failed to update user")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] })
      setUpdatingId(null)
    },
    onError: () => {
      setUpdatingId(null)
      alert("Failed to update user role/status.")
    }
  })

  const canManage = (session?.user as any)?.role === "super_admin"

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontSize: "1.375rem", fontWeight: "700", margin: "0 0 0.25rem" }}>Team Management</h1>
          <p style={{ color: "#64748b", fontSize: "0.875rem", margin: 0 }}>Manage platform access and user roles</p>
        </div>
        <button 
          disabled
          style={{ 
            display: "flex", alignItems: "center", gap: "0.5rem", 
            padding: "0.5rem 1rem", background: "#f1f5f9", 
            color: "#64748b", borderRadius: "0.5rem", fontSize: "0.875rem", 
            fontWeight: "500", border: "1px solid #e2e8f0", cursor: "not-allowed" 
          }}
        >
          <UserPlus style={{ width: "16px", height: "16px" }} />
          Invite Member
        </button>
      </div>

      <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "0.75rem", overflow: "hidden shadow-sm" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
              <th style={{ textAlign: "left", padding: "1rem 1.25rem", fontSize: "0.75rem", fontWeight: "600", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>User</th>
              <th style={{ textAlign: "left", padding: "1rem 1.25rem", fontSize: "0.75rem", fontWeight: "600", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>Role</th>
              <th style={{ textAlign: "left", padding: "1rem 1.25rem", fontSize: "0.75rem", fontWeight: "600", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>Status</th>
              <th style={{ textAlign: "left", padding: "1rem 1.25rem", fontSize: "0.75rem", fontWeight: "600", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>Joined</th>
              <th style={{ textAlign: "right", padding: "1rem 1.25rem" }}></th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} style={{ padding: "3rem", textAlign: "center", color: "#94a3b8" }}>Loading members...</td>
              </tr>
            ) : users?.map((user) => (
              <tr key={user.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                <td style={{ padding: "0.875rem 1.25rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <div style={{ 
                      width: "36px", height: "36px", borderRadius: "50%", 
                      background: "linear-gradient(135deg, #3b82f6, #6366f1)", 
                      display: "flex", alignItems: "center", justifyContent: "center", 
                      color: "white", fontSize: "0.8125rem", fontWeight: "600" 
                    }}>
                      {user.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <span style={{ fontSize: "0.875rem", fontWeight: "600", color: "#0f172a" }}>{user.name}</span>
                      <span style={{ fontSize: "0.75rem", color: "#64748b", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                        <Mail style={{ width: "10px", height: "10px" }} />
                        {user.email}
                      </span>
                    </div>
                  </div>
                </td>
                <td style={{ padding: "0.875rem 1.25rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <select
                      value={user.role}
                      disabled={!canManage || updatingId === user.id}
                      onChange={(e) => {
                        setUpdatingId(user.id)
                        updateMutation.mutate({ id: user.id, role: e.target.value })
                      }}
                      style={{
                        padding: "0.25rem 0.5rem", borderRadius: "0.375rem", 
                        border: "1px solid #e2e8f0", background: "#f8fafc",
                        fontSize: "0.75rem", fontWeight: "500", color: "#0f172a",
                        cursor: canManage ? "pointer" : "default"
                      }}
                    >
                      <option value="super_admin">Super Admin</option>
                      <option value="editor">Editor</option>
                      <option value="author">Author</option>
                      <option value="viewer">Viewer</option>
                    </select>
                  </div>
                </td>
                <td style={{ padding: "0.875rem 1.25rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
                    {user.isActive ? (
                      <>
                        <CheckCircle2 style={{ width: "14px", height: "14px", color: "#10b981" }} />
                        <span style={{ fontSize: "0.75rem", color: "#059669", fontWeight: "500" }}>Active</span>
                      </>
                    ) : (
                      <>
                        <XCircle style={{ width: "14px", height: "14px", color: "#ef4444" }} />
                        <span style={{ fontSize: "0.75rem", color: "#dc2626", fontWeight: "500" }}>Deactivated</span>
                      </>
                    )}
                  </div>
                </td>
                <td style={{ padding: "0.875rem 1.25rem" }}>
                   <span style={{ fontSize: "0.75rem", color: "#64748b", display: "flex", alignItems: "center", gap: "0.375rem" }}>
                    <Calendar style={{ width: "12px", height: "12px" }} />
                    {formatRelativeTime(user.createdAt)}
                  </span>
                </td>
                <td style={{ padding: "0.875rem 1.25rem", textAlign: "right" }}>
                  {canManage && user.id !== session?.user?.id && (
                    <button
                      onClick={() => {
                        if (confirm(`Are you sure you want to ${user.isActive ? "deactivate" : "activate"} this user?`)) {
                          setUpdatingId(user.id)
                          updateMutation.mutate({ id: user.id, isActive: !user.isActive })
                        }
                      }}
                      style={{
                        color: user.isActive ? "#dc2626" : "#2563eb",
                        fontSize: "0.75rem", fontWeight: "600",
                        background: "none", border: "none", cursor: "pointer",
                        padding: "0.25rem 0.5rem"
                      }}
                    >
                      {user.isActive ? "Deactivate" : "Activate"}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!isLoading && users?.length === 0 && (
          <div style={{ padding: "3rem", textAlign: "center", color: "#94a3b8" }}>
            No users found.
          </div>
        )}
      </div>
    </div>
  )
}
