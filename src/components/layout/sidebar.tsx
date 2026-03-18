"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { signOut } from "@/lib/auth-client"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  FileText,
  Tag,
  Briefcase,
  Inbox,
  PenSquare,
  Mail,
  Users,
  Settings,
  LogOut,
  History,
  Image as ImageIcon,
} from "lucide-react"

const navigation = [
  {
    label: null,
    items: [{ href: "/", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Content",
    items: [
      { href: "/articles", label: "Articles", icon: FileText },
      { href: "/categories", label: "Categories", icon: Tag },
      { href: "/resume", label: "Resume & Profile", icon: Briefcase },
      { href: "/media", label: "Media Library", icon: ImageIcon },
    ],
  },
  {
    label: "Email",
    items: [
      { href: "/email/inbox", label: "Inbox", icon: Inbox },
      { href: "/email/compose", label: "Compose", icon: PenSquare },
      { href: "/email/templates", label: "Templates", icon: Mail },
    ],
  },
  {
    label: "Admin",
    items: [
      { href: "/users", label: "Users", icon: Users },
      { href: "/activity", label: "Activity Logs", icon: History },
      { href: "/settings", label: "Settings", icon: Settings },
    ],
  },
]

export function Sidebar({ isOpen }: { isOpen?: boolean }) {
  const pathname = usePathname()
  const router = useRouter()

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/"
    return pathname.startsWith(href)
  }

  return (
    <aside className={cn("admin-sidebar", isOpen && "open")}>
      {/* Logo */}
      <div
        style={{
          padding: "1.25rem 1rem 1rem",
          borderBottom: "1px solid #1e293b",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
          <div
            style={{
              width: "32px",
              height: "32px",
              background: "linear-gradient(135deg, #3b82f6, #6366f1)",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "0.875rem",
              fontWeight: "700",
              color: "white",
            }}
          >
            DJ
          </div>
          <div>
            <p
              style={{
                fontSize: "0.875rem",
                fontWeight: "600",
                color: "#e2e8f0",
                margin: 0,
              }}
            >
              djalilnet
            </p>
            <p
              style={{ fontSize: "0.6875rem", color: "#475569", margin: 0 }}
            >
              Admin Portal
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav
        style={{ flex: 1, padding: "0.75rem 0.625rem", overflowY: "auto" }}
      >
        {navigation.map((group, gi) => (
          <div key={gi} style={{ marginBottom: "1rem" }}>
            {group.label && (
              <p className="nav-section-label">{group.label}</p>
            )}
            {group.items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn("nav-item", isActive(item.href) && "active")}
              >
                <item.icon style={{ width: "16px", height: "16px", flexShrink: 0 }} />
                {item.label}
              </Link>
            ))}
          </div>
        ))}
      </nav>

      {/* Bottom: sign out */}
      <div
        style={{
          padding: "0.75rem",
          borderTop: "1px solid #1e293b",
        }}
      >
        <button
          onClick={async () => {
            await signOut({
              fetchOptions: {
                onSuccess: () => {
                  router.push("/login")
                },
              },
            })
          }}
          className="nav-item"
          style={{ color: "#ef4444" }}
        >
          <LogOut style={{ width: "16px", height: "16px" }} />
          Sign Out
        </button>
      </div>
    </aside>
  )
}
