"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Search, Loader2 } from "lucide-react"
import { cn, formatRelativeTime, formatDateTime, htmlToText } from "@/lib/utils"
import type { Email } from "@/db/schema"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function InboxPage() {
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<"inbox" | "sent" | "spam" | "drafts">("inbox")
  const [selectedEmail, setSelected] = useState<Email | null>(null)
  const queryClient = useQueryClient()
  const router = useRouter()

  const { data, isLoading, isError } = useQuery<{ data: Email[] }>({
    queryKey: ["emails", filter, search],
    queryFn: async () => {
      const params = new URLSearchParams({
        search,
        filter,
      })
      const res = await fetch(`/api/emails?${params}`)
      if (!res.ok) throw new Error("Failed to fetch emails")
      return res.json()
    },
  })

  const markReadMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/emails/${id}/read`, { method: "PATCH" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["emails"] }),
  })

  const handleSelectEmail = (email: Email) => {
    if (email.status === "draft") {
      router.push(`/email/compose?draftId=${email.id}`)
      return
    }
    setSelected(email)
    if (!email.isRead && email.direction === "inbound") {
      markReadMutation.mutate(email.id)
    }
  }

  const emails = data?.data ?? []

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
        <div>
          <h1 style={{ fontSize: "1.375rem", fontWeight: "700", margin: "0 0 0.25rem", textTransform: "capitalize" }}>{filter}</h1>
          <p style={{ color: "#64748b", fontSize: "0.875rem", margin: 0 }}>
            {emails.length} messages
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
              {(["inbox", "sent", "spam", "drafts"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => {
                    setFilter(f)
                    setSelected(null)
                  }}
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
              <div style={{ padding: "1rem" }}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} style={{ marginBottom: "1rem" }}>
                    <div style={{ width: "40%", height: "14px", background: "#f1f5f9", borderRadius: "4px", marginBottom: "0.5rem" }} />
                    <div style={{ width: "80%", height: "16px", background: "#e2e8f0", borderRadius: "4px", marginBottom: "0.5rem" }} />
                    <div style={{ width: "100%", height: "12px", background: "#f1f5f9", borderRadius: "4px" }} />
                  </div>
                ))}
              </div>
            ) : isError ? (
              <div style={{ padding: "3rem", textAlign: "center", color: "#ef4444", fontSize: "0.875rem" }}>
                Error loading emails.
              </div>
            ) : emails.length === 0 ? (
              <div style={{ padding: "3rem", textAlign: "center", color: "#94a3b8", fontSize: "0.875rem" }}>
                No emails found.
              </div>
            ) : (
              emails.map((email) => {
                const isUnread = !email.isRead && email.direction === "inbound"
                const previewText = (email.bodyText || htmlToText(email.bodyHtml || "No content")).replace(/\s+/g, ' ')

                return (
                  <button
                    key={email.id}
                    onClick={() => handleSelectEmail(email)}
                    style={{
                      width: "100%", textAlign: "left",
                      padding: "0.875rem 1rem",
                      borderTop: "none",
                      borderRight: "none",
                      borderBottom: "1px solid #f8fafc",
                      borderLeft: selectedEmail?.id === email.id ? "3px solid #3b82f6" : "3px solid transparent",
                      background: selectedEmail?.id === email.id ? "#eff6ff" : isUnread ? "white" : "#fafafa",
                      cursor: "pointer",
                      transition: "background 0.2s"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.25rem" }}>
                      <span style={{ fontSize: "0.8125rem", fontWeight: isUnread ? "600" : "400", color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, paddingRight: "0.5rem" }}>
                        {filter === "sent" ? email.toAddress : email.fromAddress}
                      </span>
                      <span style={{ fontSize: "0.6875rem", color: "#94a3b8", flexShrink: 0 }}>
                        {formatRelativeTime(email.receivedAt ?? email.createdAt)}
                      </span>
                    </div>
                    <p style={{ fontSize: "0.8125rem", fontWeight: isUnread ? "500" : "400", color: "#334155", margin: "0 0 0.25rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {email.subject || "(No Subject)"}
                    </p>
                    <p style={{ fontSize: "0.75rem", color: "#a1a1aa", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {previewText}
                    </p>
                    {isUnread && (
                      <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#3b82f6", marginTop: "0.375rem" }} />
                    )}
                  </button>
                )
              })
            )}
          </div>
        </div>

        {/* Email detail */}
        <div style={{ flex: 1, overflow: "hidden" }}>
          {selectedEmail ? (
            <div style={{ height: "100%", display: "flex", flexDirection: "column", background: "white" }}>
              {/* Header */}
              <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid #f1f5f9" }}>
                <h2 style={{ fontSize: "1.125rem", fontWeight: "600", margin: "0 0 0.75rem", color: "#0f172a" }}>
                  {selectedEmail.subject || "(No Subject)"}
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
              <div style={{ flex: 1, overflowY: "auto", position: "relative" }}>
                {selectedEmail.bodyHtml ? (
                  <iframe 
                    title="Email Content"
                    sandbox="allow-popups allow-popups-to-escape-sandbox"
                    srcDoc={selectedEmail.bodyHtml}
                    style={{
                      width: "100%", height: "100%", border: "none"
                    }}
                  />
                ) : (
                  <pre style={{ 
                    fontSize: "0.875rem", lineHeight: "1.75", color: "#334155", 
                    whiteSpace: "pre-wrap", fontFamily: "inherit", padding: "1.5rem",
                    margin: 0
                  }}>
                    {selectedEmail.bodyText || "No content available."}
                  </pre>
                )}
              </div>

              {/* Attachments */}
              {Array.isArray(selectedEmail.attachments) && selectedEmail.attachments.length > 0 && (
                <div style={{ padding: "1.25rem 1.5rem", borderTop: "1px solid #f1f5f9", background: "#f8fafc" }}>
                  <h3 style={{ fontSize: "0.75rem", fontWeight: "600", marginBottom: "0.75rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Attachments ({selectedEmail.attachments.length})
                  </h3>
                  <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                    {selectedEmail.attachments.map((att: any, idx: number) => {
                      const isImage = att.url?.match(/\.(jpeg|jpg|gif|png|webp)$/i) || att.type?.startsWith("image/")
                      return (
                        <a
                          key={idx}
                          href={att.url || "#"}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            display: "flex", alignItems: "center", gap: "0.5rem",
                            padding: "0.5rem 0.75rem", border: "1px solid #e2e8f0",
                            borderRadius: "0.375rem", textDecoration: "none", color: "#334155", 
                            fontSize: "0.8125rem", background: "white",
                            boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
                          }}
                        >
                          {isImage ? <span>🖼️</span> : <span>📄</span>}
                          {att.filename || `Attachment ${idx + 1}`}
                        </a>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div style={{ padding: "0.875rem 1.5rem", borderTop: "1px solid #f1f5f9", display: "flex", gap: "0.5rem" }}>
                <Link
                  href={`/email/compose?to=${selectedEmail.fromAddress}&subject=${encodeURIComponent(
                    selectedEmail.subject?.startsWith("Re:") ? selectedEmail.subject : `Re: ${selectedEmail.subject || ""}`
                  )}`}
                  style={{
                    padding: "0.4375rem 1rem",
                    background: "#f1f5f9",
                    border: "1px solid #e2e8f0",
                    borderRadius: "0.375rem",
                    fontSize: "0.8125rem",
                    fontWeight: "500",
                    color: "#334155",
                    textDecoration: "none",
                    transition: "background 0.2s"
                  }}
                >
                  Reply
                </Link>
                <Link
                  href={`/email/compose?to=${selectedEmail.fromAddress}&cc=${selectedEmail.ccAddresses || ""}&subject=${encodeURIComponent(
                    selectedEmail.subject?.startsWith("Re:") ? selectedEmail.subject : `Re: ${selectedEmail.subject || ""}`
                  )}`}
                  style={{
                    padding: "0.4375rem 1rem",
                    background: "white",
                    border: "1px solid #e2e8f0",
                    borderRadius: "0.375rem",
                    fontSize: "0.8125rem",
                    fontWeight: "500",
                    color: "#334155",
                    textDecoration: "none",
                    transition: "background 0.2s"
                  }}
                >
                  Reply All
                </Link>
              </div>
            </div>
          ) : (
            <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8", flexDirection: "column", gap: "0.5rem" }}>
              <div style={{ fontSize: "2.5rem", opacity: 0.5 }}>📫</div>
              <p style={{ margin: 0, fontWeight: "500", color: "#64748b" }}>Select a conversation to read</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
