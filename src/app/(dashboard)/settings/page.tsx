/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"

import { useState } from "react"
import { useSession, authClient } from "@/lib/auth-client"
import { useMutation } from "@tanstack/react-query"
import { 
  User, 
  Lock, 
  Shield, 
  Settings as SettingsIcon, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  Camera
} from "lucide-react"

export default function SettingsPage() {
  const { data: session, isPending: isSessionLoading } = useSession()
  const user = session?.user

  // Profile Form State
  const [name, setName] = useState(user?.name ?? "")
  const [profileSuccess, setProfileSuccess] = useState(false)

  // Password Form State
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [passError, setPassError] = useState("")
  const [passSuccess, setPassSuccess] = useState(false)

  const profileMutation = useMutation({
    mutationFn: async (newName: string) => {
      const res = await fetch("/api/users/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName }),
      })
      if (!res.ok) throw new Error("Failed to update profile")
      return res.json()
    },
    onSuccess: () => {
      setProfileSuccess(true)
      setTimeout(() => setProfileSuccess(false), 3000)
    },
  })

  const passwordMutation = useMutation({
    mutationFn: async () => {
      if (newPassword !== confirmPassword) {
        throw new Error("Passwords do not match")
      }
      const { error } = await authClient.changePassword({
        newPassword,
        currentPassword,
        revokeOtherSessions: true,
      })
      if (error) throw new Error(error.message || "Failed to change password")
    },
    onSuccess: () => {
      setPassSuccess(true)
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      setPassError("")
      setTimeout(() => setPassSuccess(false), 5000)
    },
    onError: (error: Error) => {
      setPassError(error.message)
    }
  })

  if (isSessionLoading) return <div style={{ padding: "2rem", textAlign: "center" }}>Loading settings...</div>

  return (
    <div style={{ maxWidth: "800px" }}>
      <div style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "1.375rem", fontWeight: "700", margin: "0 0 0.25rem" }}>Settings</h1>
        <p style={{ color: "#64748b", fontSize: "0.875rem", margin: 0 }}>Manage your profile and account security</p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        
        {/* Profile Section */}
        <section style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "0.75rem", padding: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.25rem" }}>
            <User style={{ width: "18px", height: "18px", color: "#3b82f6" }} />
            <h2 style={{ fontSize: "1rem", fontWeight: "600", margin: 0 }}>Public Profile</h2>
          </div>

          <div style={{ display: "flex", gap: "2rem", alignItems: "flex-start" }}>
            <div style={{ position: "relative" }}>
              <div style={{
                width: "80px", height: "80px", borderRadius: "50%",
                background: "linear-gradient(135deg, #3b82f6, #6366f1)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "1.75rem", fontWeight: "700", color: "white",
              }}>
                {user?.name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) ?? "DA"}
              </div>
              <button style={{
                position: "absolute", bottom: 0, right: 0,
                width: "28px", height: "28px", borderRadius: "50%",
                background: "white", border: "1px solid #e2e8f0",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 2px 4px rgba(0,0,0,0.05)", cursor: "not-allowed"
              }} title="Avatar upload coming soon">
                <Camera style={{ width: "14px", height: "14px", color: "#64748b" }} />
              </button>
            </div>

            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                <label style={{ fontSize: "0.875rem", fontWeight: "500", color: "#0f172a" }}>Display Name</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{
                    padding: "0.5rem 0.75rem", borderRadius: "0.5rem",
                    border: "1px solid #e2e8f0", fontSize: "0.875rem",
                  }}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                <label style={{ fontSize: "0.875rem", fontWeight: "500", color: "#0f172a" }}>Email Address</label>
                <input 
                  type="email" 
                  value={user?.email ?? ""} 
                  disabled
                  style={{
                    padding: "0.5rem 0.75rem", borderRadius: "0.5rem",
                    border: "1px solid #e2e8f0", fontSize: "0.875rem",
                    background: "#f8fafc", color: "#94a3b8", cursor: "not-allowed"
                  }}
                />
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginTop: "0.5rem" }}>
                <button
                  onClick={() => profileMutation.mutate(name)}
                  disabled={profileMutation.isPending || name === user?.name}
                  style={{
                    padding: "0.5rem 1.25rem", borderRadius: "0.5rem",
                    background: "#0f172a", color: "white", border: "none",
                    fontSize: "0.875rem", fontWeight: "500", cursor: "pointer",
                    display: "flex", alignItems: "center", gap: "0.5rem", opacity: (profileMutation.isPending || name === user?.name) ? 0.6 : 1
                  }}
                >
                  {profileMutation.isPending && <Loader2 className="animate-spin" style={{ width: "14px", height: "14px" }} />}
                  Save Changes
                </button>
                {profileSuccess && (
                  <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", color: "#10b981", fontSize: "0.875rem" }}>
                    <CheckCircle2 style={{ width: "16px", height: "16px" }} />
                    Profile updated!
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Security Section */}
        <section style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "0.75rem", padding: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.25rem" }}>
            <Lock style={{ width: "18px", height: "18px", color: "#f59e0b" }} />
            <h2 style={{ fontSize: "1rem", fontWeight: "600", margin: 0 }}>Security</h2>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "1rem", maxWidth: "400px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
              <label style={{ fontSize: "0.875rem", fontWeight: "500", color: "#0f172a" }}>Current Password</label>
              <input 
                type="password" 
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                style={{ padding: "0.5rem 0.75rem", borderRadius: "0.5rem", border: "1px solid #e2e8f0", fontSize: "0.875rem" }}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
              <label style={{ fontSize: "0.875rem", fontWeight: "500", color: "#0f172a" }}>New Password</label>
              <input 
                type="password" 
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                style={{ padding: "0.5rem 0.75rem", borderRadius: "0.5rem", border: "1px solid #e2e8f0", fontSize: "0.875rem" }}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
              <label style={{ fontSize: "0.875rem", fontWeight: "500", color: "#0f172a" }}>Confirm New Password</label>
              <input 
                type="password" 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                style={{ padding: "0.5rem 0.75rem", borderRadius: "0.5rem", border: "1px solid #e2e8f0", fontSize: "0.875rem" }}
              />
            </div>

            {passError && (
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#ef4444", fontSize: "0.8125rem" }}>
                <AlertCircle style={{ width: "14px", height: "14px" }} />
                {passError}
              </div>
            )}

            <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginTop: "0.5rem" }}>
              <button
                onClick={() => passwordMutation.mutate()}
                disabled={passwordMutation.isPending || !currentPassword || !newPassword}
                style={{
                  padding: "0.5rem 1.25rem", borderRadius: "0.5rem",
                  background: "#0f172a", color: "white", border: "none",
                  fontSize: "0.875rem", fontWeight: "500", cursor: "pointer",
                  display: "flex", alignItems: "center", gap: "0.5rem",
                  opacity: (passwordMutation.isPending || !currentPassword || !newPassword) ? 0.6 : 1
                }}
              >
                {passwordMutation.isPending && <Loader2 className="animate-spin" style={{ width: "14px", height: "14px" }} />}
                Update Password
              </button>
              {passSuccess && (
                <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", color: "#10b981", fontSize: "0.875rem" }}>
                  <CheckCircle2 style={{ width: "16px", height: "16px" }} />
                  Password updated successfully!
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Info Section */}
        <section style={{ background: "#f8fafc", border: "1px dashed #e2e8f0", borderRadius: "0.75rem", padding: "1.25rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
            <Shield style={{ width: "16px", height: "16px", color: "#64748b" }} />
            <h3 style={{ fontSize: "0.875rem", fontWeight: "600", color: "#475569", margin: 0 }}>Role & Permissions</h3>
          </div>
          <p style={{ fontSize: "0.8125rem", color: "#64748b", margin: 0, lineHeight: "1.5" }}>
            Your account is assigned the <strong style={{color: "#0f172a"}}>{(user as { role?: string })?.role ?? "Author"}</strong> role. 
            Permissions are managed by platform administrators. Contact your system admin to request role changes.
          </p>
        </section>

      </div>
    </div>
  )
}
