"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { RichTextEditor } from "@/components/editor/rich-text-editor"
import { slugify } from "@/lib/utils"
import { ArrowLeft, Save, Globe, Loader2 } from "lucide-react"
import Link from "next/link"
import type { JSONContent } from "@tiptap/react"

interface Category { id: string; name: string }

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
  fontWeight: "600",
  color: "#64748b",
  marginBottom: "0.375rem",
  textTransform: "uppercase" as const,
  letterSpacing: "0.05em",
}

export default function NewArticlePage() {
  const router = useRouter()
  const [title, setTitle] = useState("")
  const [slug, setSlug] = useState("")
  const [excerpt, setExcerpt] = useState("")
  const [categoryId, setCategoryId] = useState("")
  const [content, setContent] = useState<JSONContent | null>(null)
  const [contentHtml, setContentHtml] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)

  const { data: categoriesData } = useQuery<{ data: Category[] }>({
    queryKey: ["categories"],
    queryFn: () => fetch("/api/categories").then((r) => r.json()),
  })

  const handleTitleChange = (value: string) => {
    setTitle(value)
    if (!slug || slug === slugify(title)) {
      setSlug(slugify(value))
    }
  }

  const handleEditorChange = useCallback((json: JSONContent, html: string) => {
    setContent(json)
    setContentHtml(html)
  }, [])

  const save = async (status: "draft" | "published") => {
    const loading = status === "draft" ? setIsSaving : setIsPublishing
    loading(true)
    try {
      const res = await fetch("/api/articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          slug,
          content,
          contentHtml,
          excerpt,
          categoryId: categoryId || null,
          status,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        router.push(`/articles/${data.data.id}`)
      }
    } finally {
      loading(false)
    }
  }

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1.25rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <Link
            href="/articles"
            style={{ color: "#64748b", display: "flex", alignItems: "center" }}
          >
            <ArrowLeft style={{ width: "18px", height: "18px" }} />
          </Link>
          <h1 style={{ fontSize: "1.25rem", fontWeight: "700", margin: 0 }}>
            New Article
          </h1>
        </div>
        <div style={{ display: "flex", gap: "0.625rem" }}>
          <button
            onClick={() => save("draft")}
            disabled={isSaving || !title}
            style={{
              display: "flex", alignItems: "center", gap: "0.375rem",
              padding: "0.5rem 1rem",
              border: "1px solid #e2e8f0",
              borderRadius: "0.5rem",
              background: "white",
              fontSize: "0.875rem",
              fontWeight: "500",
              color: "#374151",
              cursor: isSaving || !title ? "not-allowed" : "pointer",
              opacity: isSaving || !title ? 0.6 : 1,
            }}
          >
            {isSaving ? <Loader2 style={{ width: "14px", height: "14px", animation: "spin 1s linear infinite" }} /> : <Save style={{ width: "14px", height: "14px" }} />}
            Save Draft
          </button>
          <button
            onClick={() => save("published")}
            disabled={isPublishing || !title}
            style={{
              display: "flex", alignItems: "center", gap: "0.375rem",
              padding: "0.5rem 1rem",
              border: "none",
              borderRadius: "0.5rem",
              background: "linear-gradient(135deg, #3b82f6, #6366f1)",
              fontSize: "0.875rem",
              fontWeight: "500",
              color: "white",
              cursor: isPublishing || !title ? "not-allowed" : "pointer",
              opacity: isPublishing || !title ? 0.7 : 1,
            }}
          >
            {isPublishing ? <Loader2 style={{ width: "14px", height: "14px", animation: "spin 1s linear infinite" }} /> : <Globe style={{ width: "14px", height: "14px" }} />}
            Publish
          </button>
        </div>
      </div>

      {/* Editor + Sidebar */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: "1rem", alignItems: "start" }}>

        {/* Left: Title + Editor */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <input
            type="text"
            placeholder="Article title here..."
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            style={{
              width: "100%",
              padding: "0.75rem 1rem",
              fontSize: "1.5rem",
              fontWeight: "700",
              border: "1px solid #e2e8f0",
              borderRadius: "0.5rem",
              background: "white",
              outline: "none",
              color: "#0f172a",
              boxSizing: "border-box",
            }}
          />
          <RichTextEditor
            onChange={handleEditorChange}
            placeholder="Start writing your article..."
          />
        </div>

        {/* Right: Metadata sidebar */}
        <div
          style={{
            background: "white",
            border: "1px solid #e2e8f0",
            borderRadius: "0.75rem",
            padding: "1rem",
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
            position: "sticky",
            top: "1rem",
          }}
        >
          <h3 style={{ fontSize: "0.875rem", fontWeight: "600", margin: 0, color: "#0f172a" }}>
            Article Settings
          </h3>

          <div>
            <label style={labelStyle}>Category</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              style={{ ...inputStyle, background: "white" }}
            >
              <option value="">No category</option>
              {categoriesData?.data.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={labelStyle}>Slug</label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="article-slug"
              style={inputStyle}
            />
            <p style={{ fontSize: "0.6875rem", color: "#94a3b8", marginTop: "0.25rem" }}>
              /blog/{slug || "article-slug"}
            </p>
          </div>

          <div>
            <label style={labelStyle}>Excerpt</label>
            <textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="Brief description of the article..."
              rows={3}
              style={{ ...inputStyle, resize: "vertical" }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
