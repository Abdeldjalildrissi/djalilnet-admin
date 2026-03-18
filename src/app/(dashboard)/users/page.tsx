"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useSession } from "@/lib/auth-client"
import { 
  UserPlus, 
  Shield, 
  Mail,
  Calendar,
  CheckCircle2,
  XCircle,
  X,
  Loader2
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
  
  // Invite Modal State
  const [showInvite, setShowInvite] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteName, setInviteName] = useState("")
  const [inviteRole, setInviteRole] = useState("author")
  const [isInviting, setIsInviting] = useState(false)

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

  const handleInvite = async () => {
    setIsInviting(true)
    try {
      // In a real scenario, this would create an invitation token and send an email.
      // For this demo, we'll hit an endpoint that simulates an invitation.
      const res = await fetch("/api/emails/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: inviteEmail,
          subject: "Invitation to Join djalilnet Admin",
          bodyHtml: `
            <h1>Hello ${inviteName},</h1>
            <p>You have been invited to join the djalilnet Admin portal as an <strong>${inviteRole}</strong>.</p>
            <p>Please use your email to sign up at <a href="https://admin.djalilnet.com/login">admin.djalilnet.com</a>.</p>
          `
        })
      })
      
      if (!res.ok) throw new Error("Failed to send invite")
      
      alert(`Invitation sent to ${inviteEmail}`)
      setShowInvite(false)
      setInviteEmail(""); setInviteName("")
    } catch (err) {
      alert("Error sending invitation.")
    } finally {
      setIsInviting(false)
    }
  }

  const canManage = (session?.user as { role?: string })?.role === "super_admin"

  const inputStyle = {
    width: "100%", padding: "0.5rem 0.75rem",
    border: "1px solid #e2e8f0", borderRadius: "0.375rem",
    fontSize: "0.875rem", outline: "none", boxSizing: "border-box" as const,
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontSize: "1.375rem", fontWeight: "700", margin: "0 0 0.25rem" }}>Team Management</h1>
          <p style={{ color: "#64748b", fontSize: "0.875rem", margin: 0 }}>Manage platform access and user roles</p>
        </div>
        <button 
          onClick={() => setShowInvite(true)}
          disabled={!canManage}
          style={{ 
            display: "flex", alignItems: "center", gap: "0.5rem", 
            padding: "0.5rem 1rem", background: canManage ? "linear-gradient(135deg, #3b82f6, #6366f1)" : "#f1f5f9", 
            color: canManage ? "white" : "#64748b", borderRadius: "0.5rem", fontSize: "0.875rem", 
            fontWeight: "500", border: "1px solid #e2e8f0", cursor: canManage ? "pointer" : "not-allowed" 
          }}
        >
          <UserPlus style={{ width: "16px", height: "16px" }} />
          Invite Member
        </button>
      </div>

      {/* Invite Modal */}
      {showInvite && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.4)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div style={{ background: "white", borderRadius: "1rem", width: "100%", maxWidth: "450px", padding: "1.5rem", boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1.5rem" }}>
              <h3 style={{ fontSize: "1rem", fontWeight: "700", margin: 0 }}>Invite Team Member</h3>
              <button onClick={() => setShowInvite(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}>
                <X style={{ width: "20px", height: "20px" }} />
              </button>
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: "500", color: "#374151", marginBottom: "0.375rem" }}>Full Name</label>
                <input value={inviteName} onChange={(e) => setInviteName(e.target.value)} placeholder="Member Name" style={inputStyle} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: "500", color: "#374151", marginBottom: "0.375rem" }}>Email Address</label>
                <input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="email@example.com" style={inputStyle} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: "500", color: "#374151", marginBottom: "0.375rem" }}>Initial Role</label>
                <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)} style={inputStyle}>
                  <option value="super_admin">Super Admin</option>
                  <option value="editor">Editor</option>
                  <option value="author">Author</option>
                  <option value="viewer">Viewer</option>
                </select>
              </div>
              <p style={{ fontSize: "0.75rem", color: "#64748b", margin: 0 }}>
                This will send an invitation email to the user with setup instructions.
              </p>
              <button
                onClick={handleInvite}
                disabled={isInviting || !inviteEmail || !inviteName}
                style={{
                  marginTop: "0.5rem", padding: "0.625rem", borderRadius: "0.5rem",
                  background: "#3b82f6", color: "white", border: "none",
                  fontWeight: "600", fontSize: "0.875rem", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem"
                }}
              >
                {isInviting && <Loader2 style={{ width: "16px", height: "16px", animation: "spin 1s linear infinite" }} />}
                Send Invitation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "0.75rem", overflow: "hidden", boxShadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
              <th style={{ textAlign: "left", padding: "1rem 1.25rem", fontSize: "0.75rem", fontWeight: "600", color: "#64748b", textTransform: "uppercase" }}>User</th>
              <th style={{ textAlign: "left", padding: "1rem 1.25rem", fontSize: "0.75rem", fontWeight: "600", color: "#64748b", textTransform: "uppercase" }}>Role</th>
              <th style={{ textAlign: "left", padding: "1rem 1.25rem", fontSize: "0.75rem", fontWeight: "600", color: "#64748b", textTransform: "uppercase" }}>Status</th>
              <th style={{ textAlign: "left", padding: "1rem 1.25rem", fontSize: "0.75rem", fontWeight: "600", color: "#64748b", textTransform: "uppercase" }}>Joined</th>
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
                </td>
                <td style={{ padding: "0.875rem 1.25rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
                    {user.isActive ? (
                      <><CheckCircle2 style={{ width: "14px", height: "14px", color: "#10b981" }} /><span style={{ fontSize: "0.75rem", color: "#059669", fontWeight: "500" }}>Active</span></>
                    ) : (
                      <><XCircle style={{ width: "14px", height: "14px", color: "#ef4444" }} /><span style={{ fontSize: "0.75rem", color: "#dc2626", fontWeight: "500" }}>Deactivated</span></>
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
      </div>
    </div>
  )
}
