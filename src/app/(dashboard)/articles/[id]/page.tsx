"use client"

import { useState, useCallback, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { RichTextEditor } from "@/components/editor/rich-text-editor"
import { ArrowLeft, Save, Globe, Loader2, Trash2, Cloud, CheckCircle, FolderOpen } from "lucide-react"
import Link from "next/link"
import type { JSONContent } from "@tiptap/react"
import { useToast } from "@/hooks/use-toast"

interface Category { id: string; name: string }
interface Article {
  id: string; title: string; slug: string; excerpt: string | null;
  content: JSONContent | null; status: string; categoryId: string | null;
  readingTime: number | null;
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
  const { id } = use(params)
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const [title, setTitle] = useState("")
  const [slug, setSlug] = useState("")
  const [excerpt, setExcerpt] = useState("")
  const [categoryId, setCategoryId] = useState("")
  const [content, setContent] = useState<JSONContent | null>(null)
  const [contentHtml, setContentHtml] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [lastAutoSave, setLastAutoSave] = useState<Date | null>(null)

  const { data: articleData, isLoading: isArticleLoading } = useQuery<{ data: Article }>({
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

  // Auto-save to LocalStorage
  useEffect(() => {
    if (!id || !title) return
    const timer = setInterval(() => {
      const draft = { title, slug, excerpt, categoryId, content, contentHtml }
      localStorage.setItem(`article-draft-${id}`, JSON.stringify(draft))
      setLastAutoSave(new Date())
    }, 15000)
    return () => clearInterval(timer)
  }, [id, title, slug, excerpt, categoryId, content, contentHtml])

  // Background Server Save (only for drafts)
  useEffect(() => {
    if (articleData?.data.status !== "draft" || !id || !title) return
    const timer = setInterval(async () => {
      try {
        await fetch(`/api/articles/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, slug, content, contentHtml, excerpt, categoryId: categoryId || null, status: "draft" }),
        })
      } catch (e) {
        console.warn("Background auto-save failed", e)
      }
    }, 60000)
    return () => clearInterval(timer)
  }, [id, title, slug, content, contentHtml, excerpt, categoryId, articleData])

  const save = async (status: "draft" | "published") => {
    setIsSaving(true)
    try {
      const res = await fetch(`/api/articles/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title, slug, content, contentHtml, excerpt,
          categoryId: categoryId || null, status,
        }),
      })
      if (!res.ok) throw new Error("Failed to save")
      
      toast({ title: "Success", description: `Article ${status === "published" ? "published" : "saved"} successfully.` })
      queryClient.invalidateQueries({ queryKey: ["article", id] })
      router.refresh()
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm("Delete this article permanently?")) return
    await fetch(`/api/articles/${id}`, { method: "DELETE" })
    router.push("/articles")
    toast({ title: "Deleted", description: "Article has been removed." })
  }

  if (isArticleLoading) return <div style={{ padding: "2rem", color: "#94a3b8" }}>Loading...</div>

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
        <div style={{ display: "flex", gap: "0.625rem", alignItems: "center" }}>
          {lastAutoSave && (
            <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.75rem", color: "#64748b", marginRight: "0.5rem" }}>
              <Cloud style={{ width: "14px", height: "14px", color: "#10b981" }} />
              Saved {lastAutoSave.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          )}
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
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
               <span style={{ 
                 fontSize: "0.6875rem", fontWeight: "700", textTransform: "uppercase",
                 padding: "0.25rem 0.5rem", borderRadius: "1rem",
                 background: articleData?.data.status === "published" ? "#dcfce7" : "#f1f5f9",
                 color: articleData?.data.status === "published" ? "#15803d" : "#475569"
               }}>
                {articleData?.data.status}
              </span>
            </div>
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
