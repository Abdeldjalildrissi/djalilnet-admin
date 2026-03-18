"use client"

import { useState, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { RichTextEditor } from "@/components/editor/rich-text-editor"
import { ArrowLeft, Save, Globe, Loader2, Trash2 } from "lucide-react"
import Link from "next/link"
import type { JSONContent } from "@tiptap/react"

interface Category { id: string; name: string }
interface Article {
  id: string; title: string; slug: string; excerpt: string | null;
  content: JSONContent | null; status: string; categoryId: string | null;
}

const inputStyle = {
  width: "100%",
  padding: "0.5rem 0.75rem",
  border: "1px solid #e2e8f0",
  borderRadius: "0.375rem",
  fontSize: "0.875rem",
  outline: "none",
  boxSizing: "border-box" as const,
}

const labelStyle = {
  display: "block",
  fontSize: "0.75rem",
  fontWeight: "600" as const,
  color: "#64748b",
  marginBottom: "0.375rem",
  textTransform: "uppercase" as const,
  letterSpacing: "0.05em",
}

export default function EditArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [id, setId] = useState<string | null>(null)
  const [title, setTitle] = useState("")
  const [slug, setSlug] = useState("")
  const [excerpt, setExcerpt] = useState("")
  const [categoryId, setCategoryId] = useState("")
  const [content, setContent] = useState<JSONContent | null>(null)
  const [contentHtml, setContentHtml] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  // Resolve params
  useEffect(() => {
    params.then((p) => setId(p.id))
  }, [params])

  const { data: articleData } = useQuery<{ data: Article }>({
    queryKey: ["article", id],
    queryFn: () => fetch(`/api/articles/${id}`).then((r) => r.json()),
    enabled: !!id,
  })

  const { data: categoriesData } = useQuery<{ data: Category[] }>({
    queryKey: ["categories"],
    queryFn: () => fetch("/api/categories").then((r) => r.json()),
  })

  // Populate when article loads
  useEffect(() => {
    if (articleData?.data) {
      const a = articleData.data
      setTitle(a.title)
      setSlug(a.slug)
      setExcerpt(a.excerpt ?? "")
      setCategoryId(a.categoryId ?? "")
      setContent(a.content)
    }
  }, [articleData])

  const handleEditorChange = useCallback((json: JSONContent, html: string) => {
    setContent(json)
    setContentHtml(html)
  }, [])

  const save = async (status: "draft" | "published") => {
    setIsSaving(true)
    try {
      await fetch(`/api/articles/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title, slug, content, contentHtml, excerpt,
          categoryId: categoryId || null, status,
        }),
      })
      router.refresh()
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm("Delete this article permanently?")) return
    await fetch(`/api/articles/${id}`, { method: "DELETE" })
    router.push("/articles")
  }

  if (!id) return <div style={{ padding: "2rem", color: "#94a3b8" }}>Loading...</div>

  return (
    <div>
      <div
        style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <Link href="/articles" style={{ color: "#64748b", display: "flex", alignItems: "center" }}>
            <ArrowLeft style={{ width: "18px", height: "18px" }} />
          </Link>
          <h1 style={{ fontSize: "1.25rem", fontWeight: "700", margin: 0 }}>Edit Article</h1>
        </div>
        <div style={{ display: "flex", gap: "0.625rem" }}>
          <button
            onClick={handleDelete}
            style={{
              display: "flex", alignItems: "center", gap: "0.375rem",
              padding: "0.5rem 1rem", border: "1px solid #fee2e2",
              borderRadius: "0.5rem", background: "white",
              fontSize: "0.875rem", fontWeight: "500", color: "#ef4444", cursor: "pointer",
            }}
          >
            <Trash2 style={{ width: "14px", height: "14px" }} /> Delete
          </button>
          <button
            onClick={() => save("draft")}
            disabled={isSaving}
            style={{
              display: "flex", alignItems: "center", gap: "0.375rem",
              padding: "0.5rem 1rem", border: "1px solid #e2e8f0",
              borderRadius: "0.5rem", background: "white",
              fontSize: "0.875rem", fontWeight: "500", color: "#374151", cursor: "pointer",
            }}
          >
            {isSaving ? <Loader2 style={{ width: "14px", height: "14px", animation: "spin 1s linear infinite" }} /> : <Save style={{ width: "14px", height: "14px" }} />}
            Save
          </button>
          <button
            onClick={() => save("published")}
            disabled={isSaving}
            style={{
              display: "flex", alignItems: "center", gap: "0.375rem",
              padding: "0.5rem 1rem", border: "none",
              borderRadius: "0.5rem", background: "linear-gradient(135deg, #3b82f6, #6366f1)",
              fontSize: "0.875rem", fontWeight: "500", color: "white", cursor: "pointer",
            }}
          >
            <Globe style={{ width: "14px", height: "14px" }} /> Publish
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: "1rem", alignItems: "start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <input
            type="text"
            placeholder="Article title here..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{
              width: "100%", padding: "0.75rem 1rem", fontSize: "1.5rem", fontWeight: "700",
              border: "1px solid #e2e8f0", borderRadius: "0.5rem",
              background: "white", outline: "none", color: "#0f172a", boxSizing: "border-box",
            }}
          />
          {content !== null && (
            <RichTextEditor
              content={content}
              onChange={handleEditorChange}
              placeholder="Start writing..."
            />
          )}
        </div>

        <div
          style={{
            background: "white", border: "1px solid #e2e8f0",
            borderRadius: "0.75rem", padding: "1rem",
            display: "flex", flexDirection: "column", gap: "1rem",
            position: "sticky", top: "1rem",
          }}
        >
          <h3 style={{ fontSize: "0.875rem", fontWeight: "600", margin: 0, color: "#0f172a" }}>
            Article Settings
          </h3>

          <div>
            <label style={labelStyle}>Status</label>
            <span
              className={`badge badge-${articleData?.data.status ?? "draft"}`}
            >
              {articleData?.data.status ?? "draft"}
            </span>
          </div>

          <div>
            <label style={labelStyle}>Category</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              style={{ ...inputStyle, background: "white" }}
            >
              <option value="">No category</option>
              {categoriesData?.data?.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={labelStyle}>Slug</label>
            <input
              type="text" value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="article-slug" style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Excerpt</label>
            <textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="Brief description..."
              rows={3} style={{ ...inputStyle, resize: "vertical" }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
