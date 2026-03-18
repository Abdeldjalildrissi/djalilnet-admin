"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react"
import { formatRelativeTime } from "@/lib/utils"

interface Template {
  id: string; name: string; subject: string;
  bodyHtml: string; variables: string[]; createdAt: string
}

export default function TemplatesPage() {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState("")
  const [subject, setSubject] = useState("")
  const [bodyHtml, setBodyHtml] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  const { data, isLoading } = useQuery<{ data: Template[] }>({
    queryKey: ["email-templates"],
    queryFn: () => fetch("/api/email/templates").then((r) => r.json()),
  })

  const handleCreate = async () => {
    setIsSaving(true)
    try {
      await fetch("/api/email/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, subject, bodyHtml }),
      })
      queryClient.invalidateQueries({ queryKey: ["email-templates"] })
      setShowForm(false)
      setName(""); setSubject(""); setBodyHtml("")
    } finally { setIsSaving(false) }
  }

  const inputStyle = {
    width: "100%", padding: "0.5rem 0.75rem",
    border: "1px solid #e2e8f0", borderRadius: "0.375rem",
    fontSize: "0.875rem", outline: "none", boxSizing: "border-box" as const,
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
        <h1 style={{ fontSize: "1.375rem", fontWeight: "700", margin: 0 }}>Email Templates</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            display: "flex", alignItems: "center", gap: "0.375rem",
            padding: "0.5rem 1rem",
            background: "linear-gradient(135deg, #3b82f6, #6366f1)",
            color: "white", border: "none", borderRadius: "0.5rem",
            fontSize: "0.875rem", fontWeight: "500", cursor: "pointer",
          }}
        >
          <Plus style={{ width: "15px", height: "15px" }} />
          New Template
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div
          style={{
            background: "white", border: "1px solid #e2e8f0",
            borderRadius: "0.75rem", padding: "1.25rem",
            marginBottom: "1rem",
          }}
        >
          <h3 style={{ fontSize: "0.9375rem", fontWeight: "600", margin: "0 0 1rem" }}>New Template</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: "500", color: "#374151", marginBottom: "0.375rem" }}>Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Template name" style={inputStyle} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: "500", color: "#374151", marginBottom: "0.375rem" }}>Subject</label>
              <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Email subject (use {{variable}} for placeholders)" style={inputStyle} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: "500", color: "#374151", marginBottom: "0.375rem" }}>Body (HTML)</label>
              <textarea
                value={bodyHtml}
                onChange={(e) => setBodyHtml(e.target.value)}
                placeholder="<p>Hello {{name}},</p><p>Your message here...</p>"
                rows={6}
                style={{ ...inputStyle, fontFamily: "monospace", resize: "vertical" }}
              />
            </div>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                onClick={handleCreate}
                disabled={isSaving || !name || !subject || !bodyHtml}
                style={{
                  padding: "0.5rem 1rem", border: "none", borderRadius: "0.5rem",
                  background: "#3b82f6", color: "white",
                  fontSize: "0.875rem", fontWeight: "500", cursor: "pointer",
                }}
              >
                {isSaving ? "Saving..." : "Save Template"}
              </button>
              <button
                onClick={() => setShowForm(false)}
                style={{
                  padding: "0.5rem 1rem", border: "1px solid #e2e8f0",
                  borderRadius: "0.5rem", background: "white",
                  fontSize: "0.875rem", fontWeight: "500", cursor: "pointer",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Templates list */}
      <div
        style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "0.75rem", overflow: "hidden" }}
      >
        {isLoading ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "#94a3b8" }}>
            <Loader2 style={{ width: "20px", height: "20px", animation: "spin 1s linear infinite" }} />
          </div>
        ) : !data?.data || data.data.length === 0 ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "#94a3b8" }}>
            No templates yet. Create your first template to speed up email sending.
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Subject</th>
                <th>Variables</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {data?.data?.map((template) => (
                <tr key={template.id}>
                  <td style={{ fontWeight: "500", color: "#0f172a" }}>{template.name}</td>
                  <td style={{ color: "#64748b" }}>{template.subject}</td>
                  <td>
                    {template.variables?.map((v) => (
                      <span key={v} style={{ display: "inline-block", padding: "2px 6px", background: "#f1f5f9", borderRadius: "4px", fontSize: "0.75rem", marginRight: "4px" }}>
                        {`{{${v}}}`}
                      </span>
                    ))}
                  </td>
                  <td style={{ color: "#94a3b8", fontSize: "0.8125rem" }}>
                    {formatRelativeTime(template.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
