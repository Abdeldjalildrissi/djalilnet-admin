"use client"

import { useState, useCallback, Suspense, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { RichTextEditor } from "@/components/editor/rich-text-editor"
import { ArrowLeft, Send, Loader2, Paperclip, X, FileIcon } from "lucide-react"
import Link from "next/link"
import type { JSONContent } from "@tiptap/react"
import { UploadButton } from "@/lib/uploadthing"

interface Template { id: string; name: string; subject: string; bodyHtml: string }
interface Attachment { filename: string; url: string; size?: number }

const inputStyle = {
  width: "100%",
  padding: "0.5rem 0.75rem",
  border: "1px solid #e2e8f0",
  borderRadius: "0.375rem",
  fontSize: "0.875rem",
  outline: "none",
  boxSizing: "border-box" as const,
  background: "white",
}

function ComposeInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const draftId = searchParams.get("draftId")

  const [to, setTo] = useState(searchParams.get("to") ?? "")
  const [from, setFrom] = useState("contact@djalilnet.com")
  const [cc, setCc] = useState("")
  const [subject, setSubject] = useState(searchParams.get("subject") ?? "")
  const [templateId, setTemplateId] = useState("")
  const [bodyHtml, setBodyHtml] = useState("")
  const [attachments, setAttachments] = useState<Attachment[]>([])
  
  const [isSending, setIsSending] = useState(false)
  const [isSavingDraft, setIsSavingDraft] = useState(false)
  const [successMsg, setSuccessMsg] = useState("")
  const [error, setError] = useState("")

  const { data: templatesData } = useQuery<{ data: Template[] }>({
    queryKey: ["email-templates"],
    queryFn: () => fetch("/api/email/templates").then((r) => r.json()),
  })

  const { data: draftData } = useQuery({
    queryKey: ["draft", draftId],
    queryFn: () => fetch(`/api/emails/${draftId}`).then((r) => r.json()),
    enabled: !!draftId,
  })

  useEffect(() => {
    if (draftData?.data) {
      const email = draftData.data;
      setFrom(email.fromAddress || "contact@djalilnet.com");
      setTo(email.toAddress || "");
      setCc(email.ccAddresses || "");
      setSubject(email.subject || "");
      setTemplateId(email.templateId || "");
      setBodyHtml(email.bodyHtml || "");
      setAttachments(email.attachments || []);
    }
  }, [draftData])

  const handleTemplateChange = (id: string) => {
    setTemplateId(id)
    if (!id) return
    const template = templatesData?.data?.find((t) => t.id === id)
    if (template) {
      setSubject(template.subject)
      setBodyHtml(template.bodyHtml)
    }
  }

  const handleEditorChange = useCallback((_: JSONContent, html: string) => {
    setBodyHtml(html)
  }, [])

  const handleSend = async () => {
    setError("")
    setIsSending(true)
    try {
      const res = await fetch("/api/emails/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          from,
          to,
          cc: cc ? cc.split(",").map((e) => e.trim()) : undefined,
          subject,
          bodyHtml,
          templateId: templateId || undefined,
          draftId: draftId || undefined,
          attachments: attachments.length > 0 ? attachments : undefined,
        }),
      })
      if (res.ok) {
        setSuccessMsg("Email sent successfully!")
        setTimeout(() => router.push("/email/inbox"), 1500)
      } else {
        const data = await res.json()
        const errorData = data.error
        if (typeof errorData === "string") {
          setError(errorData)
        } else if (errorData?.fieldErrors) {
          const firstErr = Object.values(errorData.fieldErrors)[0] as string[]
          setError(firstErr?.[0] || "Validation failed")
        } else {
          setError(errorData?.message || "Failed to send email")
        }
      }
    } finally {
      setIsSending(false)
    }
  }

  const handleSaveDraft = async () => {
    setError("")
    setIsSavingDraft(true)
    try {
      const res = await fetch("/api/emails/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          from,
          to,
          cc: cc ? cc.split(",").map((e) => e.trim()) : undefined,
          subject,
          bodyHtml,
          templateId: templateId || undefined,
          draftId: draftId || undefined,
          attachments: attachments.length > 0 ? attachments : undefined,
        }),
      })
      if (res.ok) {
        setSuccessMsg("Draft saved successfully!")
        setTimeout(() => router.push("/email/inbox"), 1500)
      } else {
        const data = await res.json()
        setError(data.error || "Failed to save draft")
      }
    } finally {
      setIsSavingDraft(false)
    }
  }

  const removeAttachment = (url: string) => {
    setAttachments(prev => prev.filter(a => a.url !== url))
  }

  if (successMsg) {
    return (
      <div style={{ textAlign: "center", padding: "4rem", color: "#10b981" }}>
        <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>✅</div>
        <p style={{ fontWeight: "600" }}>{successMsg}</p>
        <p style={{ color: "#94a3b8", fontSize: "0.875rem" }}>Redirecting to inbox...</p>
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <Link href="/email/inbox" style={{ color: "#64748b", display: "flex", alignItems: "center" }}>
            <ArrowLeft style={{ width: "18px", height: "18px" }} />
          </Link>
          <h1 style={{ fontSize: "1.375rem", fontWeight: "700", margin: 0 }}>Compose Email</h1>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <button
            onClick={handleSaveDraft}
            disabled={isSavingDraft || isSending}
            style={{
              padding: "0.5rem 1rem", border: "1px solid #e2e8f0", background: "white",
              borderRadius: "0.5rem", color: "#64748b", fontSize: "0.875rem", fontWeight: "500",
              cursor: isSavingDraft || isSending ? "not-allowed" : "pointer"
            }}
          >
            {isSavingDraft ? "Saving..." : "Save Draft"}
          </button>
          <button
            onClick={handleSend}
            disabled={isSending || isSavingDraft || !to || !subject || !bodyHtml}
            style={{
              display: "flex", alignItems: "center", gap: "0.375rem",
              padding: "0.5rem 1.25rem", border: "none",
              borderRadius: "0.5rem",
              background: isSending || isSavingDraft || !to || !subject || !bodyHtml ? "#94a3b8" : "linear-gradient(135deg, #3b82f6, #6366f1)",
              color: "white", fontSize: "0.875rem", fontWeight: "500",
              cursor: isSending || isSavingDraft || !to || !subject || !bodyHtml ? "not-allowed" : "pointer",
            }}
          >
            {isSending ? <Loader2 style={{ width: "14px", height: "14px", animation: "spin 1s linear infinite" }} /> : <Send style={{ width: "14px", height: "14px" }} />}
            {isSending ? "Sending..." : "Send"}
          </button>
        </div>
      </div>

      <div
        style={{
          background: "white",
          border: "1px solid #e2e8f0",
          borderRadius: "0.75rem",
          overflow: "hidden",
        }}
      >
        {error && (
          <div style={{ padding: "0.75rem 1.25rem", background: "#fef2f2", borderBottom: "1px solid #fecaca", color: "#dc2626", fontSize: "0.875rem" }}>
            {error}
          </div>
        )}

        {/* Fields */}
        {[
          { label: "From", value: from, setter: setFrom, type: "select", options: ["contact@djalilnet.com", "team@djalilnet.com", "professional@djalilnet.com"] },
          { label: "To", value: to, setter: setTo, placeholder: "recipient@example.com", type: "email" },
          { label: "CC", value: cc, setter: setCc, placeholder: "cc@example.com (comma-separated)", type: "text" },
          { label: "Subject", value: subject, setter: setSubject, placeholder: "Email subject", type: "text" },
        ].map(({ label, value, setter, placeholder, type, options }) => (
          <div
            key={label}
            style={{ display: "flex", alignItems: "center", borderBottom: "1px solid #f1f5f9" }}
          >
            <span style={{ width: "80px", padding: "0.75rem 1rem", fontSize: "0.8125rem", fontWeight: "500", color: "#94a3b8", flexShrink: 0 }}>
              {label}
            </span>
            {type === "select" ? (
              <select
                value={value}
                onChange={(e) => setter(e.target.value)}
                style={{
                  flex: 1, padding: "0.75rem 1rem 0.75rem 0",
                  border: "none", fontSize: "0.875rem", outline: "none", background: "transparent"
                }}
              >
                {options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            ) : (
              <input
                type={type}
                value={value}
                onChange={(e) => setter(e.target.value)}
                placeholder={placeholder}
                style={{
                  flex: 1, padding: "0.75rem 1rem 0.75rem 0",
                  border: "none", fontSize: "0.875rem", outline: "none",
                }}
              />
            )}
          </div>
        ))}

        {/* Template & Attachments Row */}
        <div style={{ display: "flex", borderBottom: "1px solid #f1f5f9" }}>
          <div style={{ flex: 1, display: "flex", alignItems: "center", borderRight: "1px solid #f1f5f9" }}>
            <span style={{ width: "80px", padding: "0.75rem 1rem", fontSize: "0.8125rem", fontWeight: "500", color: "#94a3b8", flexShrink: 0 }}>
              Template
            </span>
            <select
              value={templateId}
              onChange={(e) => handleTemplateChange(e.target.value)}
              style={{ flex: 1, padding: "0.75rem 1rem 0.75rem 0", border: "none", fontSize: "0.875rem", outline: "none", background: "transparent" }}
            >
              <option value="">No template</option>
              {templatesData?.data?.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
          <div style={{ padding: "0.5rem 1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <UploadButton
              endpoint="emailAttachmentUploader"
              onClientUploadComplete={(res) => {
                setAttachments(prev => [...prev, ...res.map(f => ({ filename: f.name, url: f.url, size: f.size }))])
              }}
              className="ut-button:h-8 ut-button:px-3 ut-button:text-xs ut-button:bg-slate-100 ut-button:text-slate-600 ut-button:border-slate-200 ut-button:hover:bg-slate-200 ut-allowed-content:hidden"
              content={{
                button({ ready }) {
                  return <div style={{ display: "flex", alignItems: "center", gap: "4px" }}><Paperclip style={{ width: "12px" }}/> {ready ? "Attach" : "..."}</div>
                }
              }}
            />
          </div>
        </div>

        {/* Selected Attachments */}
        {attachments.length > 0 && (
          <div style={{ padding: "0.75rem 1rem", display: "flex", flexWrap: "wrap", gap: "0.5rem", background: "#f8fafc", borderBottom: "1px solid #f1f5f9" }}>
            {attachments.map((file) => (
              <div key={file.url} style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "4px 8px", background: "white", border: "1px solid #e2e8f0", borderRadius: "6px", fontSize: "0.75rem", color: "#475569" }}>
                <FileIcon style={{ width: "12px", height: "12px", color: "#94a3b8" }} />
                <span style={{ maxWidth: "150px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{file.filename}</span>
                <button onClick={() => removeAttachment(file.url)} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", display: "flex", alignItems: "center" }}>
                  <X style={{ width: "12px", height: "12px" }} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Body */}
        <div>
          <RichTextEditor
            content={bodyHtml ? undefined : null}
            onChange={handleEditorChange}
            placeholder="Write your email..."
            minHeight="400px"
          />
        </div>
      </div>
    </div>
  )
}

export default function ComposePage() {
  return (
    <Suspense fallback={<div style={{ padding: "2rem", color: "#94a3b8" }}>Loading...</div>}>
      <ComposeInner />
    </Suspense>
  )
}
