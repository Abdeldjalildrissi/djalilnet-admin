"use client"

import { SidebarProvider } from "./sidebar-context"
import { Sidebar } from "./sidebar"
import { Header } from "./header"

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div
        style={{
          display: "flex",
          height: "100vh",
          background: "#f8fafc",
          overflow: "hidden",
          position: "relative",
        }}
      >
        <Sidebar />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            overflow: "hidden",
            minWidth: 0,
          }}
        >
          <Header />
          <main
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "1rem md:1.5rem",
            }}
          >
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}
