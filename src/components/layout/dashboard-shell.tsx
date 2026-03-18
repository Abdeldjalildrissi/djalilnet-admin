"use client"

import React, { useState, useEffect, useCallback } from "react"
import { Sidebar } from "./sidebar"
import { Header } from "./header"
import { usePathname } from "next/navigation"

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const pathname = usePathname()

  const closeMenu = useCallback(() => setIsMobileMenuOpen(false), [])
  const openMenu = useCallback(() => setIsMobileMenuOpen(true), [])

  // Close mobile menu on route change
  useEffect(() => {
    closeMenu()
  }, [pathname, closeMenu])

  // ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isMobileMenuOpen) {
        closeMenu()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isMobileMenuOpen, closeMenu])

  // Swipe Gestures
  const [touchStart, setTouchStart] = useState<number | null>(null)
  
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX)
  }
  
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return
    const touchEnd = e.changedTouches[0].clientX
    const distance = touchStart - touchEnd
    
    // Swipe Left to close
    if (distance > 50 && isMobileMenuOpen) {
      closeMenu()
    }
    // Swipe Right to open (only if starting near the left edge)
    if (distance < -50 && touchStart < 50 && !isMobileMenuOpen) {
      openMenu()
    }
  }

  return (
    <div 
      className="flex h-screen bg-[#f8fafc] overflow-hidden relative w-full"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Dimmed Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 z-40 md:hidden transition-opacity duration-300 ease-in-out"
          onClick={closeMenu}
          aria-hidden="true"
        />
      )}
      <Sidebar isOpen={isMobileMenuOpen} />
      <div className="flex flex-col flex-1 overflow-hidden min-w-0 w-full relative z-10">
        <Header toggleMenu={() => setIsMobileMenuOpen((prev) => !prev)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 w-full -webkit-overflow-scrolling-touch">
          {children}
        </main>
      </div>
    </div>
  )
}
