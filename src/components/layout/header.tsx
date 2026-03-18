"use client"

import { Bell, Search, Menu } from "lucide-react"
import { useSession } from "@/lib/auth-client"

export function Header({ toggleMenu }: { toggleMenu?: () => void }) {
  const { data: session } = useSession()
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
        padding: "0 1rem",
        gap: "1rem",
        flexShrink: 0,
      }}
    >
      <div className="flex items-center gap-3 w-full">
        {/* Mobile menu toggle */}
        <button
          onClick={toggleMenu}
          className="md:hidden p-2 -ml-2 text-slate-500 hover:text-slate-900 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg"
          aria-label="Toggle Sidebar"
        >
          <Menu className="w-6 h-6" />
        </button>

        {/* Page Title (Mobile) */}
        <div className="md:hidden font-semibold text-slate-800 text-lg truncate">
          Dashboard
        </div>

        {/* Search */}
      <div className="hidden md:block relative flex-1 max-w-[400px]">
        <Search
          style={{
            position: "absolute",
            left: "12px",
            top: "50%",
            transform: "translateY(-50%)",
            width: "16px",
            height: "16px",
            color: "#94a3b8",
          }}
        />
        <input
          type="search"
          placeholder="Search..."
          style={{
            width: "100%",
            padding: "0.5rem 0.75rem 0.5rem 2.25rem",
            border: "1px solid #e2e8f0",
            borderRadius: "0.5rem",
            fontSize: "0.875rem",
            color: "#334155",
            background: "#f8fafc",
            outline: "none",
            minHeight: "40px",
          }}
        />
      </div>
      </div>

      {/* Right actions */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        {/* Notification bell */}
        <button
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "50%",
            border: "1px solid #e2e8f0",
            background: "white",
            display: "flex",
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
