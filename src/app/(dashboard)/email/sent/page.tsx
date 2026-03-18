"use client"

import { useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Search, Loader2, RefreshCcw } from "lucide-react"
import { formatRelativeTime, formatDateTime } from "@/lib/utils"
import type { Email } from "@/db/schema"
import Link from "next/link"
import DOMPurify from "isomorphic-dompurify"

export default function SentPage() {
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<"all" | "sent" | "failed" | "bounced" | "draft">("all")
  const [selectedEmail, setSelected] = useState<Email | null>(null)
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery<{ data: Email[] }>({
    queryKey: ["emails", "sent", search, filter],
    queryFn: async () => {
      const params = new URLSearchParams({
        direction: "outbound",
        search,
        filter: filter === "all" ? "" : filter,
      })
      const res = await fetch(`/api/emails?${params}`)
      return res.json()
    },
  })

  const emails = data?.data ?? []

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
        <div>
          <h1 style={{ fontSize: "1.375rem", fontWeight: "700", margin: "0 0 0.25rem" }}>Sent & Outbound</h1>
          <p style={{ color: "#64748b", fontSize: "0.875rem", margin: 0 }}>
            {emails.length} total messages
          </p>
        </div>
        <Link
          href="/email/compose"
          style={{
            padding: "0.5rem 1rem",
            background: "linear-gradient(135deg, #3b82f6, #6366f1)",
            color: "white", borderRadius: "0.5rem",
            fontSize: "0.875rem", fontWeight: "500", textDecoration: "none",
          }}
        >
          Compose
        </Link>
      </div>

      <div
        style={{
          background: "white",
          border: "1px solid #e2e8f0",
          borderRadius: "0.75rem",
          overflow: "hidden",
          display: "flex",
          height: "calc(100vh - 200px)",
        }}
      >
        {/* Email list */}
        <div style={{ width: "380px", flexShrink: 0, borderRight: "1px solid #e2e8f0", display: "flex", flexDirection: "column" }}>
          {/* Search + filter */}
          <div style={{ padding: "0.75rem", borderBottom: "1px solid #f1f5f9" }}>
            <div style={{ position: "relative", marginBottom: "0.5rem" }}>
              <Search style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", width: "14px", height: "14px", color: "#94a3b8" }} />
              <input
                type="search"
                placeholder="Search emails..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  width: "100%", padding: "0.4375rem 0.75rem 0.4375rem 2rem",
                  border: "1px solid #e2e8f0", borderRadius: "0.5rem",
                  fontSize: "0.8125rem", outline: "none", boxSizing: "border-box",
                }}
              />
            </div>
            <div style={{ display: "flex", gap: "0.25rem", flexWrap: "wrap", justifyContent: "center" }}>
              {(["all", "sent", "failed", "bounced", "draft"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  style={{
                    padding: "3px 10px", borderRadius: "9999px",
                    border: "none", cursor: "pointer", fontSize: "0.75rem",
                    fontWeight: "500", textTransform: "capitalize",
                    background: filter === f ? "#dbeafe" : "transparent",
                    color: filter === f ? "#2563eb" : "#64748b",
                  }}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* List */}
          <div style={{ flex: 1, overflowY: "auto" }}>
            {isLoading ? (
              <div style={{ display: "flex", justifyContent: "center", padding: "2rem" }}>
                <Loader2 style={{ width: "20px", height: "20px", color: "#94a3b8", animation: "spin 1s linear infinite" }} />
              </div>
            ) : emails.length === 0 ? (
              <div style={{ padding: "3rem", textAlign: "center", color: "#94a3b8", fontSize: "0.875rem" }}>
                No emails found
              </div>
            ) : (
              emails.map((email) => (
                <button
                  key={email.id}
                  onClick={() => setSelected(email)}
                  style={{
                    width: "100%", textAlign: "left",
                    padding: "0.875rem 1rem",
                    borderBottom: "1px solid #f8fafc",
                    borderLeft: selectedEmail?.id === email.id ? "3px solid #3b82f6" : "3px solid transparent",
                    background: selectedEmail?.id === email.id ? "#eff6ff" : "#fafafa",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.25rem" }}>
                    <span style={{ fontSize: "0.8125rem", fontWeight: "500", color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "200px" }}>
                      {email.toAddress}
                    </span>
                    <span style={{ fontSize: "0.6875rem", color: "#94a3b8" }}>
                      {formatRelativeTime(email.sentAt ?? email.createdAt)}
                    </span>
                  </div>
                  <p style={{ fontSize: "0.8125rem", color: "#334155", margin: "0 0 0.25rem" }}>
                    {email.subject}
                  </p>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.25rem" }}>
                    <p style={{ fontSize: "0.75rem", color: "#94a3b8", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", width: "150px" }}>
                      {email.status === "draft" ? "Pending Queue..." : email.bodyText?.substring(0, 40)}
                    </p>
                    <span style={{ fontSize: "0.6875rem", padding: "2px 6px", borderRadius: "10px", 
                       background: email.status === "sent" ? "#dcfce7" : email.status === "failed" || email.status === "bounced" ? "#fee2e2" : "#fef3c7", 
                       color: email.status === "sent" ? "#16a34a" : email.status === "failed" || email.status === "bounced" ? "#ef4444" : "#f59e0b" }}>
                      {email.status}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Email detail */}
        <div style={{ flex: 1, overflow: "hidden" }}>
          {selectedEmail ? (
            <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
              {/* Header */}
              <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid #f1f5f9" }}>
                <h2 style={{ fontSize: "1.125rem", fontWeight: "600", margin: "0 0 0.75rem", color: "#0f172a" }}>
                  {selectedEmail.subject}
                </h2>
                <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "0.375rem 0.75rem", fontSize: "0.8125rem" }}>
                  <span style={{ color: "#94a3b8", fontWeight: "500" }}>From:</span>
                  <span style={{ color: "#374151" }}>{selectedEmail.fromAddress}</span>
                  <span style={{ color: "#94a3b8", fontWeight: "500" }}>To:</span>
                  <span style={{ color: "#374151" }}>{selectedEmail.toAddress}</span>
                  <span style={{ color: "#94a3b8", fontWeight: "500" }}>Sent Date:</span>
                  <span style={{ color: "#374151" }}>{formatDateTime(selectedEmail.sentAt ?? selectedEmail.createdAt)}</span>
                  
                  {selectedEmail.openedAt && (
                    <>
                      <span style={{ color: "#94a3b8", fontWeight: "500" }}>Opened First:</span>
                      <span style={{ color: "#10b981" }}>{formatDateTime(selectedEmail.openedAt)}</span>
                    </>
                  )}

                  {selectedEmail.clickedAt && (
                    <>
                      <span style={{ color: "#94a3b8", fontWeight: "500" }}>Clicked Link:</span>
                      <span style={{ color: "#3b82f6" }}>{formatDateTime(selectedEmail.clickedAt)}</span>
                    </>
                  )}
                  
                  {(selectedEmail.status === "failed" || selectedEmail.status === "bounced") && (
                    <>
                      <span style={{ color: "#94a3b8", fontWeight: "500" }}>Failure:</span>
                      <span style={{ color: "#ef4444" }}>{selectedEmail.failureReason ?? "Unknown issue"}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Body */}
              <div style={{ flex: 1, overflowY: "auto", padding: "1.5rem" }}>
                {selectedEmail.bodyHtml ? (
                  <div
                    style={{ fontSize: "0.875rem", lineHeight: "1.75", color: "#334155" }}
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(selectedEmail.bodyHtml ?? "") }}
                  />
                ) : (
                  <pre style={{ fontSize: "0.875rem", lineHeight: "1.75", color: "#334155", whiteSpace: "pre-wrap" }}>
                    {selectedEmail.bodyText}
                  </pre>
                )}
              </div>
            </div>
          ) : (
            <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8", flexDirection: "column", gap: "0.5rem" }}>
              <div style={{ fontSize: "2rem" }}>📤</div>
              <p style={{ margin: 0 }}>Select an email to view</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
