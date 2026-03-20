"use client"

import { Bell, Search, Menu } from "lucide-react"
import { useSession } from "@/lib/auth-client"
import { useSidebar } from "./sidebar-context"

export function Header() {
  const { data: session } = useSession()
  const { toggle } = useSidebar()
  const name = session?.user?.name ?? "Admin"
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  return (
    <header
      style={{
        height: "56px",
        background: "white",
        borderBottom: "1px solid #e2e8f0",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 1rem md:0 1.5rem",
        gap: "1rem",
        flexShrink: 0,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flex: 1 }}>
        {/* Toggle Button for Mobile */}
        <button
          onClick={toggle}
          className="flex md:hidden items-center justify-center"
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "8px",
            border: "1px solid #e2e8f0",
            background: "white",
            cursor: "pointer",
            color: "#64748b",
          }}
        >
          <Menu style={{ width: "20px", height: "20px" }} />
        </button>

        {/* Search */}
        <div style={{ position: "relative", flex: 1, maxWidth: "400px" }}>
          <Search
            style={{
              position: "absolute",
              left: "10px",
              top: "50%",
              transform: "translateY(-50%)",
              width: "14px",
              height: "14px",
              color: "#94a3b8",
            }}
          />
          <input
            type="search"
            placeholder="Search..."
            style={{
              width: "100%",
              padding: "0.375rem 0.75rem 0.375rem 2rem",
              border: "1px solid #e2e8f0",
              borderRadius: "0.5rem",
              fontSize: "0.875rem",
              color: "#334155",
              background: "#f8fafc",
              outline: "none",
            }}
          />
        </div>
      </div>

      {/* Right actions */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        {/* Notification bell */}
        <button
          className="hidden sm:flex"
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "50%",
            border: "1px solid #e2e8f0",
            background: "white",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: "#64748b",
          }}
        >
          <Bell style={{ width: "16px", height: "16px" }} />
        </button>

        {/* User avatar */}
        <div
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, #3b82f6, #6366f1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "0.75rem",
            fontWeight: "600",
            color: "white",
            cursor: "pointer",
          }}
          title={name}
        >
          {initials}
        </div>
      </div>
    </header>
  )
}
