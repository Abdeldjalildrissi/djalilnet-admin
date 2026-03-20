"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { signOut } from "@/lib/auth-client"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import { useSidebar } from "./sidebar-context"
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
  X,
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

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { isOpen, close } = useSidebar()

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/"
    return pathname.startsWith(href)
  }

  const sidebarContent = (
    <aside className="admin-sidebar" style={{ height: "100%", width: "240px" }}>
      {/* Logo */}
      <div
        style={{
          padding: "1.25rem 1rem 1rem",
          borderBottom: "1px solid #1e293b",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
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
            <p style={{ fontSize: "0.875rem", fontWeight: "600", color: "#e2e8f0", margin: 0 }}>
              djalilnet
            </p>
            <p style={{ fontSize: "0.6875rem", color: "#475569", margin: 0 }}>
              Admin Portal
            </p>
          </div>
        </div>
        
        {/* Mobile Close Button */}
        <button 
          onClick={close}
          className="md:hidden"
          style={{ 
            background: "none", border: "none", color: "#94a3b8", cursor: "pointer",
            padding: "4px"
          }}
        >
          <X size={20} />
        </button>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: "0.75rem 0.625rem", overflowY: "auto" }}>
        {navigation.map((group, gi) => (
          <div key={gi} style={{ marginBottom: "1rem" }}>
            {group.label && <p className="nav-section-label">{group.label}</p>}
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
      <div style={{ padding: "0.75rem", borderTop: "1px solid #1e293b" }}>
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

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        {sidebarContent}
      </div>

      {/* Mobile Sidebar with Drawer */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={close}
              style={{
                position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
                zIndex: 40, backdropFilter: "blur(2px)"
              }}
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              style={{
                position: "fixed", left: 0, top: 0, bottom: 0,
                width: "240px", zIndex: 50, background: "var(--sidebar-bg)"
              }}
            >
              {sidebarContent}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
