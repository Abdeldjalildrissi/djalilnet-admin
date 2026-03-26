/* eslint-disable react-hooks/set-state-in-effect */
"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
import { usePathname } from "next/navigation"

interface SidebarContextType {
  isOpen: boolean
  isExpanded: boolean
  toggle: () => void
  toggleExpanded: () => void
  close: () => void
  open: () => void
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined)

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isExpanded, setIsExpanded] = useState(true)
  const pathname = usePathname()

  // Load initial expanded state
  useEffect(() => {
    const stored = localStorage.getItem("sidebar-expanded")
    if (stored !== null) {
      setIsExpanded(stored === "true")
    }
  }, [])

  const toggle = () => setIsOpen((prev) => !prev)
  const toggleExpanded = () => {
    setIsExpanded((prev) => {
      const newState = !prev
      localStorage.setItem("sidebar-expanded", String(newState))
      return newState
    })
  }
  const close = () => setIsOpen(false)
  const open = () => setIsOpen(true)

  // Close sidebar when route changes on mobile
  useEffect(() => {
    close()
  }, [pathname])

  return (
    <SidebarContext.Provider value={{ isOpen, isExpanded, toggle, toggleExpanded, close, open }}>
      {children}
    </SidebarContext.Provider>
  )
}

export function useSidebar() {
  const context = useContext(SidebarContext)
  if (context === undefined) {
    throw new Error("useSidebar must be used within a SidebarProvider")
  }
  return context
}
