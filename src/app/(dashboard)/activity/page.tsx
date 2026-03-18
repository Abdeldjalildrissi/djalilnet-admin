"use client"

import { useQuery } from "@tanstack/react-query"
import { 
  History, 
  Download, 
  Search, 
  User, 
  FileText, 
  Mail, 
  Settings as SettingsIcon,
  Shield,
  ArrowRight
} from "lucide-react"
import { formatRelativeTime } from "@/lib/utils"
import { useState } from "react"

interface ActivityLog {
  id: string
  action: string
  resourceType: string
  resourceId: string
  metadata: Record<string, unknown>
  ipAddress: string
  createdAt: string
  user: {
    name: string
    email: string
  }
}

function ActionBadge({ action }: { action: string }) {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    "article.create": { label: "Created article", color: "#16a34a", bg: "#dcfce7" },
    "article.update": { label: "Updated article", color: "#2563eb", bg: "#dbeafe" },
    "article.delete": { label: "Deleted article", color: "#dc2626", bg: "#fef2f2" },
    "category.create": { label: "Created category", color: "#16a34a", bg: "#dcfce7" },
    "email.send": { label: "Sent email", color: "#7c3aed", bg: "#ede9fe" },
    "user.update_profile": { label: "Updated profile", color: "#7c3aed", bg: "#ede9fe" },
    "user.update": { label: "Updated user", color: "#2563eb", bg: "#dbeafe" },
  }
  const info = map[action] ?? { label: action, color: "#64748b", bg: "#f1f5f9" }
  return (
    <span style={{
      padding: "2px 8px", borderRadius: "9999px",
      fontSize: "0.6875rem", fontWeight: "600",
      color: info.color, background: info.bg,
      textTransform: "uppercase", letterSpacing: "0.025em"
    }}>
      {info.label}
    </span>
  )
}

export default function ActivityPage() {
  const [searchTerm, setSearchTerm] = useState("")

  const { data: logs, isLoading } = useQuery<ActivityLog[]>({
    queryKey: ["activity-logs"],
    queryFn: async () => {
      const res = await fetch("/api/activity")
      if (!res.ok) throw new Error("Failed to fetch logs")
      return res.json()
    },
  })

  const filteredLogs = logs?.filter(log => 
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.resourceType?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontSize: "1.375rem", fontWeight: "700", margin: "0 0 0.25rem" }}>Audit Logs</h1>
          <p style={{ color: "#64748b", fontSize: "0.875rem", margin: 0 }}>Monitor all platform activities and system changes</p>
        </div>
        <a 
          href="/api/activity/export"
          download
          style={{ 
            display: "flex", alignItems: "center", gap: "0.5rem", 
            padding: "0.5rem 1rem", background: "#0f172a", 
            color: "white", borderRadius: "0.5rem", fontSize: "0.875rem", 
            fontWeight: "500", border: "none", cursor: "pointer",
            textDecoration: "none"
          }}
        >
          <Download style={{ width: "16px", height: "16px" }} />
          Export CSV
        </a>
      </div>

      <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "0.75rem", overflow: "hidden" }}>
        <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
           <div style={{ position: "relative", width: "300px" }}>
              <Search style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", width: "14px", height: "14px", color: "#94a3b8" }} />
              <input 
                type="text" 
                placeholder="Search by action, user, or type..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ 
                  width: "100%", padding: "0.375rem 0.75rem 0.375rem 2rem", 
                  borderRadius: "0.5rem", border: "1px solid #e2e8f0", 
                  fontSize: "0.8125rem" 
                }}
              />
           </div>
           <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
              Showing {filteredLogs?.length ?? 0} recent activities
           </div>
        </div>

        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
              <th style={{ textAlign: "left", padding: "1rem 1.25rem", fontSize: "0.75rem", fontWeight: "600", color: "#64748b", textTransform: "uppercase" }}>Time</th>
              <th style={{ textAlign: "left", padding: "1rem 1.25rem", fontSize: "0.75rem", fontWeight: "600", color: "#64748b", textTransform: "uppercase" }}>User</th>
              <th style={{ textAlign: "left", padding: "1rem 1.25rem", fontSize: "0.75rem", fontWeight: "600", color: "#64748b", textTransform: "uppercase" }}>Action</th>
              <th style={{ textAlign: "left", padding: "1rem 1.25rem", fontSize: "0.75rem", fontWeight: "600", color: "#64748b", textTransform: "uppercase" }}>Type</th>
              <th style={{ textAlign: "left", padding: "1rem 1.25rem", fontSize: "0.75rem", fontWeight: "600", color: "#64748b", textTransform: "uppercase" }}>Summary</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={5} style={{ padding: "3rem", textAlign: "center", color: "#94a3b8" }}>Loading logs...</td></tr>
            ) : filteredLogs?.length === 0 ? (
              <tr><td colSpan={5} style={{ padding: "3rem", textAlign: "center", color: "#94a3b8" }}>No records match your search.</td></tr>
            ) : filteredLogs?.map((log) => (
              <tr key={log.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                <td style={{ padding: "0.875rem 1.25rem", fontSize: "0.75rem", color: "#64748b" }}>
                  {formatRelativeTime(log.createdAt)}
                </td>
                <td style={{ padding: "0.875rem 1.25rem" }}>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <span style={{ fontSize: "0.8125rem", fontWeight: "600", color: "#0f172a" }}>{log.user?.name || "System"}</span>
                    <span style={{ fontSize: "0.6875rem", color: "#94a3b8" }}>{log.user?.email || "system@local"}</span>
                  </div>
                </td>
                <td style={{ padding: "0.875rem 1.25rem" }}>
                  <ActionBadge action={log.action} />
                </td>
                <td style={{ padding: "0.875rem 1.25rem" }}>
                  <span style={{ fontSize: "0.75rem", fontWeight: "500", color: "#475569" }}>
                    {log.resourceType || "System"}
                  </span>
                </td>
                <td style={{ padding: "0.875rem 1.25rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.75rem", color: "#64748b" }}>
                    <span>ID: {log.resourceId?.slice(0, 8) || "N/A"}</span>
                    {log.metadata && (log.metadata as { fields?: string[] }).fields && (
                      <span style={{ color: "#94a3b8" }} title={JSON.stringify(log.metadata)}>
                         ({((log.metadata as { fields?: string[] }).fields as string[]).join(", ")})
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
