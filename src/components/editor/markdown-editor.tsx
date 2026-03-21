"use client"

import { useState, useEffect, useCallback } from "react"
import { marked } from "marked"
import DOMPurify from "isomorphic-dompurify"
import "@/styles/markdown.css" // Custom styles for the preview

interface MarkdownEditorProps {
  content?: any // expects { type: "markdown", text: "..." } or a raw string
  onChange: (content: any, html: string) => void
  placeholder?: string
  minHeight?: string
}

export function MarkdownEditor({
  content,
  onChange,
  placeholder = "Write your Markdown here...",
  minHeight = "500px",
}: MarkdownEditorProps) {
  const [markdown, setMarkdown] = useState(() => {
    if (!content) return ""
    if (typeof content === "string") return content
    if (content.type === "markdown") return content.text || ""
    // If it's Tiptap JSON, we can't easily parse it back to MD here, 
    // so we return empty or a warning text.
    if (content.type === "doc") return "/* This article was written in the Rich Text Editor and cannot be loaded into the Markdown Editor. Please switch modes. */\n"
    return ""
  })

  const [htmlPreview, setHtmlPreview] = useState("")

  // Parse markdown to HTML and sanitize
  const updatePreview = useCallback((md: string) => {
    try {
      // Configure marked to use GitHub Flavored Markdown
      marked.setOptions({
        gfm: true,
        breaks: true,
      })
      const rawHtml = marked.parse(md) as string
      const cleanHtml = DOMPurify.sanitize(rawHtml)
      setHtmlPreview(cleanHtml)
      
      // Pass the updated content back up
      onChange({ type: "markdown", text: md }, cleanHtml)
    } catch (e) {
      console.error("Markdown parsing error", e)
    }
  }, [onChange])

  // Initialize preview on mount
  useEffect(() => {
    if (markdown) {
      updatePreview(markdown)
    }
  }, []) // run once on mount

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value
    setMarkdown(val)
    updatePreview(val)
  }

  return (
    <div 
      style={{ 
        display: "grid", 
        gridTemplateColumns: "1fr 1fr", 
        gap: "1.5rem",
        minHeight,
        background: "white",
        border: "1px solid #e2e8f0",
        borderRadius: "0.5rem",
        overflow: "hidden"
      }}
    >
      {/* Left: Input */}
      <div style={{ display: "flex", flexDirection: "column", borderRight: "1px solid #e2e8f0" }}>
        <div style={{ padding: "0.75rem 1rem", borderBottom: "1px solid #f1f5f9", background: "#f8fafc" }}>
          <span style={{ fontSize: "0.8125rem", fontWeight: "600", color: "#64748b" }}>MARKDOWN EDITOR</span>
        </div>
        <textarea
          value={markdown}
          onChange={handleChange}
          placeholder={placeholder}
          style={{
            flex: 1,
            width: "100%",
            resize: "none",
            padding: "1rem",
            border: "none",
            outline: "none",
            fontSize: "0.9375rem",
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
            lineHeight: "1.6",
            color: "#334155",
            background: "transparent",
            boxSizing: "border-box"
          }}
        />
      </div>

      {/* Right: Preview */}
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "0.75rem 1rem", borderBottom: "1px solid #f1f5f9", background: "#f8fafc" }}>
          <span style={{ fontSize: "0.8125rem", fontWeight: "600", color: "#64748b" }}>LIVE PREVIEW</span>
        </div>
        <div 
          style={{ 
            flex: 1, 
            padding: "1rem 1.5rem", 
            overflowY: "auto",
            maxHeight: "800px" 
          }}
        >
          {htmlPreview ? (
            <div 
              className="markdown-preview"
              dangerouslySetInnerHTML={{ __html: htmlPreview }} 
            />
          ) : (
            <div style={{ color: "#94a3b8", fontStyle: "italic", fontSize: "0.875rem", marginTop: "1rem" }}>
              Preview will appear here...
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
