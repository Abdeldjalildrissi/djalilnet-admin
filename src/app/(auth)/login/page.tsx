"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { signIn } from "@/lib/auth-client"
import { Lock, Mail, Eye, EyeOff, Loader2 } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const result = await signIn.email({ email, password })
      if (result.error) {
        setError(result.error.message ?? "Invalid credentials")
      } else {
        router.push("/")
        router.refresh()
      }
    } catch (err) {
      setError("Something went wrong. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div
      style={{
        width: "100%",
        maxWidth: "400px",
        animation: "fadeIn 0.3s ease-out",
      }}
    >
      {/* Card */}
      <div
        style={{
          background: "rgba(30, 41, 59, 0.8)",
          backdropFilter: "blur(20px)",
          borderRadius: "1rem",
          padding: "2rem",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 25px 50px rgba(0,0,0,0.5)",
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div
            style={{
              width: "56px",
              height: "56px",
              background: "linear-gradient(135deg, #3b82f6, #6366f1)",
              borderRadius: "14px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.25rem",
              fontWeight: "700",
              color: "white",
              margin: "0 auto 1rem",
            }}
          >
            DJ
          </div>
          <h1
            style={{
              fontSize: "1.5rem",
              fontWeight: "700",
              color: "#e2e8f0",
              margin: "0 0 0.25rem",
            }}
          >
            Welcome back
          </h1>
          <p style={{ color: "#64748b", fontSize: "0.875rem", margin: 0 }}>
            Sign in to your admin portal
          </p>
        </div>

        {/* Error */}
        {error && (
          <div
            style={{
              background: "rgba(239, 68, 68, 0.1)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              borderRadius: "0.5rem",
              padding: "0.75rem 1rem",
              marginBottom: "1.25rem",
              color: "#fca5a5",
              fontSize: "0.875rem",
            }}
          >
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {/* Email */}
          <div>
            <label
              style={{
                display: "block",
                fontSize: "0.8125rem",
                fontWeight: "500",
                color: "#94a3b8",
                marginBottom: "0.375rem",
              }}
            >
              Email address
            </label>
            <div style={{ position: "relative" }}>
              <Mail
                style={{
                  position: "absolute",
                  left: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: "16px",
                  height: "16px",
                  color: "#475569",
                }}
              />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@djalilnet.com"
                style={{
                  width: "100%",
                  padding: "0.625rem 0.875rem 0.625rem 2.5rem",
                  background: "rgba(15, 23, 42, 0.5)",
                  border: "1px solid #334155",
                  borderRadius: "0.5rem",
                  color: "#e2e8f0",
                  fontSize: "0.875rem",
                  outline: "none",
                  transition: "border-color 0.15s",
                  boxSizing: "border-box",
                }}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label
              style={{
                display: "block",
                fontSize: "0.8125rem",
                fontWeight: "500",
                color: "#94a3b8",
                marginBottom: "0.375rem",
              }}
            >
              Password
            </label>
            <div style={{ position: "relative" }}>
              <Lock
                style={{
                  position: "absolute",
                  left: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: "16px",
                  height: "16px",
                  color: "#475569",
                }}
              />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  width: "100%",
                  padding: "0.625rem 2.5rem 0.625rem 2.5rem",
                  background: "rgba(15, 23, 42, 0.5)",
                  border: "1px solid #334155",
                  borderRadius: "0.5rem",
                  color: "#e2e8f0",
                  fontSize: "0.875rem",
                  outline: "none",
                  transition: "border-color 0.15s",
                  boxSizing: "border-box",
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  color: "#475569",
                  cursor: "pointer",
                  padding: 0,
                  display: "flex",
                }}
              >
                {showPassword ? (
                  <EyeOff style={{ width: "16px", height: "16px" }} />
                ) : (
                  <Eye style={{ width: "16px", height: "16px" }} />
                )}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            style={{
              marginTop: "0.5rem",
              width: "100%",
              padding: "0.625rem",
              background: isLoading
                ? "#1d4ed8"
                : "linear-gradient(135deg, #3b82f6, #6366f1)",
              color: "white",
              border: "none",
              borderRadius: "0.5rem",
              fontSize: "0.875rem",
              fontWeight: "600",
              cursor: isLoading ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
              transition: "opacity 0.15s",
              opacity: isLoading ? 0.8 : 1,
            }}
          >
            {isLoading && <Loader2 style={{ width: "16px", height: "16px", animation: "spin 1s linear infinite" }} />}
            {isLoading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>

      <p style={{ textAlign: "center", color: "#334155", fontSize: "0.75rem", marginTop: "1.5rem" }}>
        djalilnet.com — Admin Portal v1.0
      </p>
    </div>
  )
}
