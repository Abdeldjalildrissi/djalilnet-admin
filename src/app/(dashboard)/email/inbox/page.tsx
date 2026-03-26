/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any */
"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Search, Loader2, ArrowLeft, RefreshCw, AlertCircle } from "lucide-react"
import { cn, formatRelativeTime, formatDateTime, htmlToText } from "@/lib/utils"
import type { Email } from "@/db/schema"
import Link from "next/link"
import { useRouter } from "next/navigation"

type FilterType = "inbox" | "sent" | "spam" | "drafts"

export default function InboxPage() {
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<FilterType>("inbox")
  const [selectedEmail, setSelected] = useState<Email | null>(null)
  // Mobile view: "list" | "detail"
  const [mobileView, setMobileView] = useState<"list" | "detail">("list")
  const queryClient = useQueryClient()
  const router = useRouter()

  const { data, isLoading, isError, refetch } = useQuery<{ data: Email[] }>({
    queryKey: ["emails", filter, search],
    queryFn: async () => {
      const params = new URLSearchParams({ search, filter })
      const res = await fetch(`/api/emails?${params}`)
      if (!res.ok) throw new Error("Failed to fetch emails")
      return res.json()
    },
    retry: 2,
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
    setMobileView("detail")
    if (!email.isRead && email.direction === "inbound") {
      markReadMutation.mutate(email.id)
    }
  }

  const handleBack = () => {
    setMobileView("list")
    setSelected(null)
  }

  const handleFilterChange = (f: FilterType) => {
    setFilter(f)
    setSelected(null)
    setMobileView("list")
  }

  const emails = data?.data ?? []

  return (
    <div className="flex flex-col h-[calc(100vh-80px)]">
      {/* Page Header */}
      <div className="flex justify-between items-center mb-4 flex-shrink-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 capitalize">{filter}</h1>
          <p className="text-slate-500 text-sm">{emails.length} messages</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <Link
            href="/email/compose"
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-medium rounded-lg hover:opacity-90 transition-all shadow-sm"
          >
            Compose
          </Link>
        </div>
      </div>

      {/* Main Container */}
      <div className="flex flex-1 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm min-h-0">

        {/* ===== EMAIL LIST PANEL ===== */}
        <div className={cn(
          "flex flex-col border-r border-slate-100 flex-shrink-0",
          // Mobile: full width, hidden when showing detail
          "w-full md:w-[340px] lg:w-[380px]",
          mobileView === "detail" ? "hidden md:flex" : "flex"
        )}>
          {/* Search + Filters */}
          <div className="p-3 border-b border-slate-100 space-y-2 flex-shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              <input
                type="search"
                placeholder="Search emails..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20 bg-slate-50"
              />
            </div>
            <div className="flex gap-1 overflow-x-auto pb-0.5 scrollbar-none">
              {(["inbox", "sent", "spam", "drafts"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => handleFilterChange(f)}
                  className={cn(
                    "px-3 py-1 rounded-full text-xs font-medium capitalize whitespace-nowrap transition-all flex-shrink-0",
                    filter === f
                      ? "bg-blue-100 text-blue-700 font-bold"
                      : "text-slate-500 hover:bg-slate-100"
                  )}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Email List Body */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-3 bg-slate-100 rounded w-2/5 mb-2" />
                    <div className="h-4 bg-slate-200 rounded w-4/5 mb-2" />
                    <div className="h-3 bg-slate-100 rounded w-full" />
                  </div>
                ))}
              </div>
            ) : isError ? (
              <div className="flex flex-col items-center justify-center p-10 text-center gap-3">
                <AlertCircle className="w-10 h-10 text-rose-400 opacity-60" />
                <div>
                  <p className="font-semibold text-slate-700 mb-1">Failed to load emails</p>
                  <p className="text-xs text-slate-400 mb-4">Check your connection and try again</p>
                  <button
                    onClick={() => refetch()}
                    className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Retry
                  </button>
                </div>
              </div>
            ) : emails.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-10 text-center gap-2">
                <div className="text-4xl opacity-30">📭</div>
                <p className="font-medium text-slate-500 text-sm">No emails found</p>
              </div>
            ) : (
              <div>
                {emails.map((email) => {
                  const isUnread = !email.isRead && email.direction === "inbound"
                  const previewText = (email.bodyText || htmlToText(email.bodyHtml || "")).replace(/\s+/g, " ").trim()
                  const isSelected = selectedEmail?.id === email.id

                  return (
                    <button
                      key={email.id}
                      onClick={() => handleSelectEmail(email)}
                      className={cn(
                        "w-full text-left px-4 py-3.5 border-b border-slate-50 transition-all cursor-pointer",
                        "border-l-[3px]",
                        isSelected
                          ? "bg-blue-50 border-l-blue-500"
                          : isUnread
                            ? "bg-white border-l-transparent hover:bg-slate-50"
                            : "bg-slate-50/50 border-l-transparent hover:bg-slate-100/60"
                      )}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className={cn(
                          "text-sm truncate pr-2 flex-1",
                          isUnread ? "font-semibold text-slate-900" : "text-slate-600"
                        )}>
                          {filter === "sent" ? email.toAddress : email.fromAddress}
                        </span>
                        <span className="text-[11px] text-slate-400 flex-shrink-0">
                          {formatRelativeTime(email.receivedAt ?? email.createdAt)}
                        </span>
                      </div>
                      <p className={cn(
                        "text-sm truncate mb-0.5",
                        isUnread ? "font-medium text-slate-800" : "text-slate-500"
                      )}>
                        {email.subject || "(No Subject)"}
                      </p>
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs text-slate-400 truncate flex-1">
                          {previewText || "No preview"}
                        </p>
                        {isUnread && (
                          <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* ===== EMAIL DETAIL PANEL ===== */}
        <div className={cn(
          "flex-1 flex flex-col min-w-0",
          // Mobile: hidden when showing list
          mobileView === "list" ? "hidden md:flex" : "flex"
        )}>
          {selectedEmail ? (
            <>
              {/* Detail Header */}
              <div className="p-4 sm:p-5 border-b border-slate-100 flex-shrink-0">
                {/* Mobile Back Button */}
                <button
                  onClick={handleBack}
                  className="md:hidden flex items-center gap-2 text-blue-600 text-sm font-medium mb-3 hover:opacity-80 transition-opacity"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <h2 className="text-base sm:text-lg font-semibold text-slate-900 mb-3 leading-snug">
                  {selectedEmail.subject || "(No Subject)"}
                </h2>
                <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
                  <span className="text-slate-400 font-medium">From:</span>
                  <span className="text-slate-700 truncate">{selectedEmail.fromAddress}</span>
                  <span className="text-slate-400 font-medium">To:</span>
                  <span className="text-slate-700 truncate">{selectedEmail.toAddress}</span>
                  <span className="text-slate-400 font-medium">Date:</span>
                  <span className="text-slate-700">{formatDateTime(selectedEmail.receivedAt ?? selectedEmail.createdAt)}</span>
                </div>
              </div>

              {/* Email Body */}
              <div className="flex-1 overflow-auto">
                {selectedEmail.bodyHtml ? (
                  <iframe
                    title="Email Content"
                    sandbox="allow-popups allow-popups-to-escape-sandbox"
                    srcDoc={selectedEmail.bodyHtml}
                    className="w-full h-full border-none"
                    style={{ minHeight: "300px" }}
                  />
                ) : (
                  <pre className="text-sm leading-relaxed text-slate-700 whitespace-pre-wrap font-sans p-5 m-0">
                    {selectedEmail.bodyText || "No content available."}
                  </pre>
                )}
              </div>

              {/* Attachments */}
              {Array.isArray(selectedEmail.attachments) && selectedEmail.attachments.length > 0 && (
                <div className="p-4 border-t border-slate-100 bg-slate-50 flex-shrink-0">
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    Attachments ({selectedEmail.attachments.length})
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedEmail.attachments.map((att: any, idx: number) => {
                      const isImage = att.url?.match(/\.(jpeg|jpg|gif|png|webp)$/i) || att.type?.startsWith("image/")
                      return (
                        <a
                          key={idx}
                          href={att.url || "#"}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-2 px-3 py-1.5 border border-slate-200 rounded-lg text-sm bg-white text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
                        >
                          <span>{isImage ? "🖼️" : "📄"}</span>
                          <span className="truncate max-w-[120px]">{att.filename || `Attachment ${idx + 1}`}</span>
                        </a>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="px-4 sm:px-5 py-3 border-t border-slate-100 flex gap-2 flex-shrink-0">
                <Link
                  href={`/email/compose?to=${encodeURIComponent(selectedEmail.fromAddress)}&subject=${encodeURIComponent(
                    selectedEmail.subject?.startsWith("Re:") ? selectedEmail.subject : `Re: ${selectedEmail.subject || ""}`
                  )}`}
                  className="px-4 py-2 bg-slate-100 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-200 transition-colors"
                >
                  Reply
                </Link>
                <Link
                  href={`/email/compose?to=${encodeURIComponent(selectedEmail.fromAddress)}&cc=${encodeURIComponent(selectedEmail.ccAddresses || "")}&subject=${encodeURIComponent(
                    selectedEmail.subject?.startsWith("Re:") ? selectedEmail.subject : `Re: ${selectedEmail.subject || ""}`
                  )}`}
                  className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Reply All
                </Link>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center gap-2 text-slate-400 p-10">
              <div className="text-5xl opacity-30">📫</div>
              <p className="font-medium text-slate-500">Select a message to read</p>
              <p className="text-xs">Your conversation will appear here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
