"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Plus, Pencil, Trash2, Loader2, Save, X } from "lucide-react"
import { formatRelativeTime } from "@/lib/utils"

interface Template {
  id: string; 
  name: string; 
  subject: string;
  bodyHtml: string; 
  variables: string[]; 
  createdAt: string
}

export default function TemplatesPage() {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  
  const [name, setName] = useState("")
  const [subject, setSubject] = useState("")
  const [bodyHtml, setBodyHtml] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  const { data, isLoading } = useQuery<{ data: Template[] }>({
    queryKey: ["email-templates"],
    queryFn: async () => {
      const r = await fetch("/api/email/templates")
      if (!r.ok) throw new Error("Failed to fetch templates")
      return r.json()
    },
  })

  // Basic variable extraction from {{var}} syntax
  const extractVariables = (text: string) => {
    const matches = text.matchAll(/\{\{(.+?)\}\}/g)
    return Array.from(new Set(Array.from(matches).map(m => m[1].trim())))
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const variables = extractVariables(subject + bodyHtml)
      const url = editingId ? `/api/email/templates/${editingId}` : "/api/email/templates"
      const method = editingId ? "PATCH" : "POST"
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, subject, bodyHtml, variables }),
      })
      
      if (!res.ok) throw new Error("Failed to save template")
      
      queryClient.invalidateQueries({ queryKey: ["email-templates"] })
      resetForm()
    } catch (err) {
      alert("Error saving template")
    } finally { setIsSaving(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this template?")) return
    try {
      const res = await fetch(`/api/email/templates/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete template")
      queryClient.invalidateQueries({ queryKey: ["email-templates"] })
    } catch (err) {
      alert("Error deleting template")
    }
  }

  const resetForm = () => {
    setShowForm(false)
    setEditingId(null)
    setName(""); setSubject(""); setBodyHtml("")
  }

  const startEdit = (template: Template) => {
    setEditingId(template.id)
    setName(template.name)
    setSubject(template.subject)
    setBodyHtml(template.bodyHtml)
    setShowForm(true)
  }

  const inputStyle = {
    width: "100%", padding: "0.5rem 0.75rem",
    border: "1px solid #e2e8f0", borderRadius: "0.375rem",
    fontSize: "0.875rem", outline: "none", boxSizing: "border-box" as const,
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
        <div>
          <h1 style={{ fontSize: "1.375rem", fontWeight: "700", margin: "0 0 0.25rem" }}>Email Templates</h1>
          <p style={{ color: "#64748b", fontSize: "0.875rem", margin: 0 }}>Create and manage reusable email layouts</p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
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
        )}
      </div>

      {/* Create/Edit form */}
      {showForm && (
        <div
          style={{
            background: "white", border: "1px solid #e2e8f0",
            borderRadius: "0.75rem", padding: "1.25rem",
            marginBottom: "1.5rem", boxShadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1.25rem" }}>
            <h3 style={{ fontSize: "0.9375rem", fontWeight: "600", margin: 0 }}>
              {editingId ? "Edit Template" : "New Template"}
            </h3>
            <button onClick={resetForm} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}>
              <X style={{ width: "18px", height: "18px" }} />
            </button>
          </div>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: "500", color: "#374151", marginBottom: "0.375rem" }}>Template Name</label>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Welcome Email" style={inputStyle} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: "500", color: "#374151", marginBottom: "0.375rem" }}>Subject Line</label>
                <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject (use {{name}} for dynamic data)" style={inputStyle} />
              </div>
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: "500", color: "#374151", marginBottom: "0.375rem" }}>Body Content (HTML)</label>
              <textarea
                value={bodyHtml}
                onChange={(e) => setBodyHtml(e.target.value)}
                placeholder="<h1>Hello {{name}}!</h1>"
                rows={10}
                style={{ ...inputStyle, fontFamily: "monospace", resize: "vertical" }}
              />
              <p style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: "0.5rem" }}>
                Tip: Variables will be automatically detected based on the <code>{"{{variable_name}}"}</code> syntax.
              </p>
            </div>
            <div style={{ display: "flex", gap: "0.75rem", paddingTop: "0.5rem" }}>
              <button
                onClick={handleSave}
                disabled={isSaving || !name || !subject || !bodyHtml}
                style={{
                  display: "flex", alignItems: "center", gap: "0.5rem",
                  padding: "0.5rem 1.25rem", border: "none", borderRadius: "0.5rem",
                  background: "#3b82f6", color: "white",
                  fontSize: "0.875rem", fontWeight: "500", cursor: "pointer",
                }}
              >
                {isSaving ? <Loader2 style={{ width: "16px", height: "16px", animation: "spin 1s linear infinite" }} /> : <Save style={{ width: "16px", height: "16px" }} />}
                {editingId ? "Update Template" : "Save Template"}
              </button>
              <button
                onClick={resetForm}
                style={{
                  padding: "0.5rem 1.25rem", border: "1px solid #e2e8f0",
                  borderRadius: "0.5rem", background: "white",
                  fontSize: "0.875rem", fontWeight: "500", cursor: "pointer",
                  color: "#374151"
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
          <div style={{ padding: "4rem", textAlign: "center", color: "#94a3b8" }}>
            <Loader2 style={{ width: "24px", height: "24px", animation: "spin 1s linear infinite", margin: "0 auto 1rem" }} />
            <p style={{ fontSize: "0.875rem" }}>Loading templates...</p>
          </div>
        ) : !data?.data || data.data.length === 0 ? (
          <div style={{ padding: "4rem", textAlign: "center", color: "#94a3b8" }}>
            <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>📄</div>
            <p style={{ fontSize: "0.875rem" }}>No templates yet. Create your first template to speed up email sending.</p>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                <th style={{ textAlign: "left", padding: "1rem 1.25rem", fontSize: "0.75rem", color: "#64748b", textTransform: "uppercase" }}>Name</th>
                <th style={{ textAlign: "left", padding: "1rem 1.25rem", fontSize: "0.75rem", color: "#64748b", textTransform: "uppercase" }}>Subject</th>
                <th style={{ textAlign: "left", padding: "1rem 1.25rem", fontSize: "0.75rem", color: "#64748b", textTransform: "uppercase" }}>Variables</th>
                <th style={{ textAlign: "left", padding: "1rem 1.25rem", fontSize: "0.75rem", color: "#64748b", textTransform: "uppercase" }}>Joined</th>
                <th style={{ textAlign: "right", padding: "1rem 1.25rem" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data?.data?.map((template) => (
                <tr key={template.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "1rem 1.25rem", fontSize: "0.875rem", fontWeight: "600", color: "#0f172a" }}>{template.name}</td>
                  <td style={{ padding: "1rem 1.25rem", fontSize: "0.875rem", color: "#64748b" }}>{template.subject}</td>
                  <td style={{ padding: "1rem 1.25rem" }}>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.25rem" }}>
                      {template.variables?.length > 0 ? template.variables.map((v) => (
                        <span key={v} style={{ padding: "2px 6px", background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: "4px", fontSize: "0.6875rem", color: "#475569" }}>
                          {v}
                        </span>
                      )) : <span style={{ fontSize: "0.75rem", color: "#cbd5e1" }}>none</span>}
                    </div>
                  </td>
                  <td style={{ padding: "1rem 1.25rem", fontSize: "0.8125rem", color: "#94a3b8" }}>
                    {formatRelativeTime(template.createdAt)}
                  </td>
                  <td style={{ padding: "1rem 1.25rem", textAlign: "right" }}>
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
                      <button
                        onClick={() => startEdit(template)}
                        style={{ padding: "0.375rem", borderRadius: "0.375rem", border: "1px solid #e2e8f0", background: "white", cursor: "pointer", color: "#64748b" }}
                        title="Edit Template"
                      >
                        <Pencil style={{ width: "14px", height: "14px" }} />
                      </button>
                      <button
                        onClick={() => handleDelete(template.id)}
                        style={{ padding: "0.375rem", borderRadius: "0.375rem", border: "1px solid #fee2e2", background: "white", cursor: "pointer", color: "#ef4444" }}
                        title="Delete Template"
                      >
                        <Trash2 style={{ width: "14px", height: "14px" }} />
                      </button>
                    </div>
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
