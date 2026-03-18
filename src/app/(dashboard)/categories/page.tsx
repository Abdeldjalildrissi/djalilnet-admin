"use client"

import { useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Plus, Loader2 } from "lucide-react"

interface Category { id: string; name: string; slug: string; description: string | null; color: string | null }

export default function CategoriesPage() {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [color, setColor] = useState("#3B82F6")
  const [isSaving, setIsSaving] = useState(false)

  const { data, isLoading } = useQuery<{ data: Category[] }>({
    queryKey: ["categories"],
    queryFn: () => fetch("/api/categories").then((r) => r.json()),
  })

  const handleCreate = async () => {
    setIsSaving(true)
    try {
      await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, color }),
      })
      queryClient.invalidateQueries({ queryKey: ["categories"] })
      setShowForm(false); setName(""); setDescription(""); setColor("#3B82F6")
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
        <div>
          <h1 style={{ fontSize: "1.375rem", fontWeight: "700", margin: "0 0 0.25rem" }}>Categories</h1>
          <p style={{ color: "#64748b", fontSize: "0.875rem", margin: 0 }}>Organize your articles</p>
        </div>
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
          <Plus style={{ width: "15px", height: "15px" }} /> New Category
        </button>
      </div>

      {showForm && (
        <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "0.75rem", padding: "1.25rem", marginBottom: "1rem" }}>
          <h3 style={{ fontSize: "0.9375rem", fontWeight: "600", margin: "0 0 1rem" }}>New Category</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: "0.75rem", alignItems: "end" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: "500", color: "#374151", marginBottom: "0.375rem" }}>Name *</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Category name" style={inputStyle} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: "500", color: "#374151", marginBottom: "0.375rem" }}>Description</label>
              <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional description" style={inputStyle} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: "500", color: "#374151", marginBottom: "0.375rem" }}>Color</label>
              <input type="color" value={color} onChange={(e) => setColor(e.target.value)} style={{ width: "48px", height: "38px", padding: "2px", border: "1px solid #e2e8f0", borderRadius: "0.375rem", cursor: "pointer" }} />
            </div>
          </div>
          <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.875rem" }}>
            <button
              onClick={handleCreate}
              disabled={isSaving || !name}
              style={{ padding: "0.5rem 1rem", border: "none", borderRadius: "0.5rem", background: "#3b82f6", color: "white", fontSize: "0.875rem", fontWeight: "500", cursor: "pointer" }}
            >
              {isSaving ? "Saving..." : "Create Category"}
            </button>
            <button
              onClick={() => setShowForm(false)}
              style={{ padding: "0.5rem 1rem", border: "1px solid #e2e8f0", borderRadius: "0.5rem", background: "white", fontSize: "0.875rem", fontWeight: "500", cursor: "pointer" }}
            >Cancel</button>
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "0.875rem" }}>
        {isLoading ? (
          <div style={{ gridColumn: "1/-1", padding: "3rem", textAlign: "center" }}>
            <Loader2 style={{ width: "24px", height: "24px", color: "#94a3b8", animation: "spin 1s linear infinite" }} />
          </div>
        ) : data?.data.length === 0 ? (
          <div style={{ gridColumn: "1/-1", padding: "3rem", textAlign: "center", color: "#94a3b8" }}>
            No categories yet. Create one to organize your articles.
          </div>
        ) : (
          data?.data.map((cat) => (
            <div
              key={cat.id}
              style={{
                background: "white", borderRadius: "0.75rem",
                border: "1px solid #e2e8f0", padding: "1rem",
                borderTop: `4px solid ${cat.color ?? "#3b82f6"}`,
              }}
            >
              <h3 style={{ fontSize: "0.9375rem", fontWeight: "600", color: "#0f172a", margin: "0 0 0.25rem" }}>{cat.name}</h3>
              <p style={{ fontSize: "0.75rem", color: "#64748b", margin: "0 0 0.5rem" }}>/{cat.slug}</p>
              {cat.description && (
                <p style={{ fontSize: "0.8125rem", color: "#94a3b8", margin: 0 }}>{cat.description}</p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
