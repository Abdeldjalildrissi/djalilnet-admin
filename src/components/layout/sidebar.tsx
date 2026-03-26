"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { signOut } from "@/lib/auth-client"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import { useSidebar } from "./sidebar-context"
import Image from "next/image"
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
  Menu,
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
  const { isOpen, isExpanded, toggleExpanded, close } = useSidebar()

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/"
    return pathname.startsWith(href)
  }

  const renderContent = (isMobile: boolean) => {
    const width = isMobile ? "240px" : (isExpanded ? "240px" : "72px")
    const showText = isMobile || isExpanded

    return (
      <aside 
        className="admin-sidebar" 
        style={{ 
          height: "100%", 
          width, 
          transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          overflow: "hidden" 
        }}
      >
        {/* Logo */}
        <div
          style={{
            padding: "1.25rem 1rem 1rem",
            borderBottom: "1px solid #1e293b",
            display: "flex",
            alignItems: "center",
            justifyContent: showText ? "space-between" : "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "#1e293b",
                overflow: "hidden",
                border: "1px solid #334155",
                flexShrink: 0,
                position: "relative"
              }}
            >
              <Image
                src="/brand/hero.png"
                alt="logo"
                fill
                className="object-cover"
              />
            </div>
            {showText && (
              <div className="fade-in">
                <p style={{ fontSize: "0.875rem", fontWeight: "600", color: "#e2e8f0", margin: 0, whiteSpace: "nowrap" }}>
                  djalilnet
                </p>
                <p style={{ fontSize: "0.6875rem", color: "#475569", margin: 0, whiteSpace: "nowrap" }}>
                  Admin Portal
                </p>
              </div>
            )}
          </div>
          
          {/* Mobile Close Button */}
          {isMobile ? (
            <button 
              onClick={close}
              className="md:hidden"
              style={{ 
                background: "none", border: "none", color: "#94a3b8", cursor: "pointer",
                padding: "4px",
                flexShrink: 0
              }}
            >
              <X size={20} />
            </button>
          ) : (
            // Desktop Toggle Button
            showText && (
              <button
                onClick={toggleExpanded}
                style={{
                  background: "none", border: "none", color: "#94a3b8", cursor: "pointer",
                  padding: "4px",
                  flexShrink: 0
                }}
              >
                <Menu size={20} />
              </button>
            )
          )}
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: "0.75rem 0.625rem", overflowY: "auto", overflowX: "hidden" }}>
          {!isMobile && !showText && (
             <div style={{ display: "flex", justifyContent: "center", marginBottom: "1rem" }}>
               <button
                 onClick={toggleExpanded}
                 style={{
                   background: "none", border: "none", color: "#94a3b8", cursor: "pointer",
                   padding: "8px"
                 }}
               >
                 <Menu size={20} />
               </button>
             </div>
          )}
          {navigation.map((group, gi) => (
            <div key={gi} style={{ marginBottom: "1rem" }}>
              {group.label && showText && <p className="nav-section-label fade-in" style={{ whiteSpace: "nowrap" }}>{group.label}</p>}
              {group.label && !showText && <div style={{ height: "1px", background: "#1e293b", margin: "1rem 0.5rem" }} />}
              {group.items.map((item) => (
                <Link
                   key={item.href}
                   href={item.href}
                   className={cn("nav-item group", isActive(item.href) && "active")}
                   style={{ 
                     justifyContent: showText ? "flex-start" : "center",
                     padding: showText ? "0.5rem 0.875rem" : "0.5rem 0",
                     position: "relative"
                   }}
                >
                  <item.icon style={{ width: "20px", height: "20px", flexShrink: 0 }} />
                  {showText ? (
                    <span className="fade-in" style={{ whiteSpace: "nowrap" }}>{item.label}</span>
                  ) : (
                    <span className="sidebar-tooltip hidden md:block">{item.label}</span>
                  )}
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
            className="nav-item group"
            style={{ 
              color: "#ef4444",
              justifyContent: showText ? "flex-start" : "center",
              padding: showText ? "0.5rem 0.875rem" : "0.5rem 0",
              position: "relative"
            }}
          >
            <LogOut style={{ width: "20px", height: "20px", flexShrink: 0 }} />
            {showText ? (
              <span className="fade-in" style={{ whiteSpace: "nowrap" }}>Sign Out</span>
            ) : (
              <span className="sidebar-tooltip hidden md:block">Sign Out</span>
            )}
          </button>
        </div>
      </aside>
    )
  }

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        {renderContent(false)}
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
              {renderContent(true)}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
