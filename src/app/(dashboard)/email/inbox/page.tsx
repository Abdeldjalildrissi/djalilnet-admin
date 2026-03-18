"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Search, Loader2, Star, Circle } from "lucide-react"
import { cn, formatRelativeTime, formatDateTime } from "@/lib/utils"
import type { Email } from "@/db/schema"
import Link from "next/link"
import DOMPurify from "isomorphic-dompurify"

export default function InboxPage() {
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all")
  const [selectedEmail, setSelected] = useState<Email | null>(null)
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery<{ data: Email[] }>({
    queryKey: ["emails", "inbox", search, filter],
    queryFn: async () => {
      const params = new URLSearchParams({
        direction: "inbound",
        search,
        filter,
      })
      const res = await fetch(`/api/emails?${params}`)
      return res.json()
    },
  })

  const markReadMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/emails/${id}/read`, { method: "PATCH" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["emails"] }),
  })

  const handleSelectEmail = (email: Email) => {
    setSelected(email)
    if (!email.isRead) markReadMutation.mutate(email.id)
  }

  const emails = data?.data ?? []

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
        <div>
          <h1 style={{ fontSize: "1.375rem", fontWeight: "700", margin: "0 0 0.25rem" }}>Inbox</h1>
          <p style={{ color: "#64748b", fontSize: "0.875rem", margin: 0 }}>
            {emails.filter((e) => !e.isRead).length} unread messages
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
            <div style={{ display: "flex", gap: "0.25rem" }}>
              {(["all", "unread", "read"] as const).map((f) => (
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
                No emails yet
              </div>
            ) : (
              emails.map((email) => (
                <button
                  key={email.id}
                  onClick={() => handleSelectEmail(email)}
                  style={{
                    width: "100%", textAlign: "left",
                    padding: "0.875rem 1rem",
                    borderBottom: "1px solid #f8fafc",
                    borderLeft: selectedEmail?.id === email.id ? "3px solid #3b82f6" : "3px solid transparent",
                    background: selectedEmail?.id === email.id ? "#eff6ff" : !email.isRead ? "white" : "#fafafa",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.25rem" }}>
                    <span style={{ fontSize: "0.8125rem", fontWeight: !email.isRead ? "600" : "400", color: "#0f172a" }}>
                      {email.fromAddress}
                    </span>
                    <span style={{ fontSize: "0.6875rem", color: "#94a3b8" }}>
                      {formatRelativeTime(email.receivedAt ?? email.createdAt)}
                    </span>
                  </div>
                  <p style={{ fontSize: "0.8125rem", fontWeight: !email.isRead ? "500" : "400", color: "#334155", margin: "0 0 0.25rem" }}>
                    {email.subject}
                  </p>
                  <p style={{ fontSize: "0.75rem", color: "#94a3b8", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {email.bodyText?.substring(0, 80)}...
                  </p>
                  {!email.isRead && (
                    <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#3b82f6", marginTop: "0.375rem" }} />
                  )}
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
                  <span style={{ color: "#94a3b8", fontWeight: "500" }}>Date:</span>
                  <span style={{ color: "#374151" }}>{formatDateTime(selectedEmail.receivedAt ?? selectedEmail.createdAt)}</span>
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

              {/* Actions */}
              <div style={{ padding: "0.875rem 1.5rem", borderTop: "1px solid #f1f5f9", display: "flex", gap: "0.5rem" }}>
                <Link
                  href={`/email/compose?to=${selectedEmail.fromAddress}&subject=Re: ${encodeURIComponent(selectedEmail.subject ?? "")}`}
                  style={{
                    padding: "0.4375rem 0.875rem",
                    border: "1px solid #e2e8f0",
                    borderRadius: "0.375rem",
                    fontSize: "0.8125rem",
                    fontWeight: "500",
                    color: "#374151",
                    textDecoration: "none",
                  }}
                >
                  Reply
                </Link>
              </div>
            </div>
          ) : (
            <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8", flexDirection: "column", gap: "0.5rem" }}>
              <div style={{ fontSize: "2rem" }}>📧</div>
              <p style={{ margin: 0 }}>Select an email to read</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
