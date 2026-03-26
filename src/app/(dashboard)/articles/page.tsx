/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"

import { useState } from "react"
import Link from "next/link"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Plus, Search, Pencil, Trash2, Eye, Loader2, Filter } from "lucide-react"
import { cn, formatRelativeTime } from "@/lib/utils"

interface Article {
  id: string
  title: string
  slug: string
  status: "draft" | "published" | "archived"
  createdAt: string
  updatedAt: string
  publishedAt: string | null
  author: { name: string } | null
  category: { name: string } | null
}

const statusOptions = [
  { value: "", label: "All Status" },
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived" },
]

export default function ArticlesPage() {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery<{ data: Article[]; pagination: { total: number } }>({
    queryKey: ["articles", search, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (search) params.set("search", search)
      if (statusFilter) params.set("status", statusFilter)
      const res = await fetch(`/api/articles?${params}`)
      return res.json()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await fetch(`/api/articles/${id}`, { method: "DELETE" })
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["articles"] }),
  })

  const handleDelete = (id: string, title: string) => {
    if (confirm(`Delete "${title}"? This cannot be undone.`)) {
      deleteMutation.mutate(id)
    }
  }

  const statusBadge = (status: Article["status"]) => {
    const map = {
      draft: "badge badge-draft",
      published: "badge badge-published",
      archived: "badge badge-archived",
    }
    return <span className={map[status]}>{status}</span>
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
        <div>
          <h1 style={{ fontSize: "1.375rem", fontWeight: "700", margin: "0 0 0.25rem" }}>
            Articles
          </h1>
          <p style={{ color: "#64748b", fontSize: "0.875rem", margin: 0 }}>
            {data?.pagination?.total ?? 0} total articles
          </p>
        </div>
        <Link
          href="/articles/new"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.375rem",
            padding: "0.5rem 1rem",
            background: "linear-gradient(135deg, #3b82f6, #6366f1)",
            color: "white",
            borderRadius: "0.5rem",
            fontSize: "0.875rem",
            fontWeight: "500",
            textDecoration: "none",
          }}
        >
          <Plus style={{ width: "15px", height: "15px" }} />
          New Article
        </Link>
      </div>

      {/* Filters */}
      <div
        style={{
          background: "white",
          borderRadius: "0.75rem",
          border: "1px solid #e2e8f0",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "0.875rem 1rem",
            borderBottom: "1px solid #f1f5f9",
            display: "flex",
            gap: "0.75rem",
            alignItems: "center",
          }}
        >
          <div style={{ position: "relative", flex: 1 }}>
            <Search
              style={{
                position: "absolute",
                left: "10px",
                top: "50%",
                transform: "translateY(-50%)",
                width: "14px",
                height: "14px",
                color: "#94a3b8",
              }}
            />
            <input
              type="search"
              placeholder="Search articles..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%",
                padding: "0.4375rem 0.75rem 0.4375rem 2rem",
                border: "1px solid #e2e8f0",
                borderRadius: "0.5rem",
                fontSize: "0.875rem",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
            <Filter style={{ width: "14px", height: "14px", color: "#94a3b8" }} />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                padding: "0.4375rem 0.75rem",
                border: "1px solid #e2e8f0",
                borderRadius: "0.5rem",
                fontSize: "0.875rem",
                background: "white",
                outline: "none",
                cursor: "pointer",
              }}
            >
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Table */}
        {isLoading ? (
          <div
            style={{
              padding: "3rem",
              display: "flex",
              justifyContent: "center",
              color: "#94a3b8",
              gap: "0.5rem",
            }}
          >
            <Loader2 style={{ width: "20px", height: "20px", animation: "spin 1s linear infinite" }} />
            Loading...
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Status</th>
                <th>Category</th>
                <th>Author</th>
                <th>Updated</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {!data?.data || data.data.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "3rem", color: "#94a3b8" }}>
                    No articles found. <Link href="/articles/new" style={{ color: "#3b82f6" }}>Create your first article</Link>
                  </td>
                </tr>
              ) : (
                data.data.map((article) => (
                  <tr key={article.id}>
                    <td>
                      <div style={{ fontWeight: "500", color: "#0f172a", marginBottom: "0.125rem" }}>
                        {article.title}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
                        /blog/{article.slug}
                      </div>
                    </td>
                    <td>{statusBadge(article.status)}</td>
                    <td style={{ color: "#64748b" }}>{article.category?.name ?? "—"}</td>
                    <td style={{ color: "#64748b" }}>{article.author?.name ?? "—"}</td>
                    <td style={{ color: "#94a3b8", fontSize: "0.8125rem" }}>
                      {formatRelativeTime(article.updatedAt)}
                    </td>
                    <td>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "flex-end",
                          gap: "0.375rem",
                        }}
                      >
                        <Link
                          href={`/articles/${article.id}`}
                          style={{
                            padding: "0.375rem",
                            borderRadius: "0.375rem",
                            color: "#64748b",
                            border: "1px solid #e2e8f0",
                            display: "flex",
                            alignItems: "center",
                            textDecoration: "none",
                          }}
                          title="Edit"
                        >
                          <Pencil style={{ width: "14px", height: "14px" }} />
                        </Link>
                        <button
                          onClick={() => handleDelete(article.id, article.title)}
                          style={{
                            padding: "0.375rem",
                            borderRadius: "0.375rem",
                            color: "#ef4444",
                            border: "1px solid #fee2e2",
                            background: "white",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                          }}
                          title="Delete"
                        >
                          <Trash2 style={{ width: "14px", height: "14px" }} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
