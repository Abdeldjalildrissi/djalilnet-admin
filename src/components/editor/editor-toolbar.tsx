"use client"

import type { Editor } from "@tiptap/react"
import { Bold, Italic, Underline as UnderlineIcon, Strikethrough, Heading1, Heading2, Heading3, List, ListOrdered, Quote, Code, Code2, Link, Undo, Redo, Minus } from "lucide-react"

interface EditorToolbarProps {
  editor: Editor
}

type ToolConfig = {
  icon: React.ElementType
  action: () => void
  isActive: boolean
  title: string
  disabled?: boolean
} | null

export function EditorToolbar({ editor }: EditorToolbarProps) {
  const setLink = () => {
    const url = window.prompt("URL:")
    if (url === null) return
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run()
      return
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run()
  }

  const tools: ToolConfig[] = [
    {
      icon: Bold,
      action: () => editor.chain().focus().toggleBold().run(),
      isActive: editor.isActive("bold"),
      title: "Bold (Ctrl+B)",
    },
    {
      icon: Italic,
      action: () => editor.chain().focus().toggleItalic().run(),
      isActive: editor.isActive("italic"),
      title: "Italic (Ctrl+I)",
    },
    {
      icon: UnderlineIcon,
      action: () => editor.chain().focus().toggleUnderline().run(),
      isActive: editor.isActive("underline"),
      title: "Underline (Ctrl+U)",
    },
    {
      icon: Strikethrough,
      action: () => editor.chain().focus().toggleStrike().run(),
      isActive: editor.isActive("strike"),
      title: "Strikethrough",
    },
    null,
    {
      icon: Heading1,
      action: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
      isActive: editor.isActive("heading", { level: 1 }),
      title: "Heading 1",
    },
    {
      icon: Heading2,
      action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
      isActive: editor.isActive("heading", { level: 2 }),
      title: "Heading 2",
    },
    {
      icon: Heading3,
      action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
      isActive: editor.isActive("heading", { level: 3 }),
      title: "Heading 3",
    },
    null,
    {
      icon: List,
      action: () => editor.chain().focus().toggleBulletList().run(),
      isActive: editor.isActive("bulletList"),
      title: "Bullet List",
    },
    {
      icon: ListOrdered,
      action: () => editor.chain().focus().toggleOrderedList().run(),
      isActive: editor.isActive("orderedList"),
      title: "Numbered List",
    },
    {
      icon: Quote,
      action: () => editor.chain().focus().toggleBlockquote().run(),
      isActive: editor.isActive("blockquote"),
      title: "Blockquote",
    },
    null,
    {
      icon: Code,
      action: () => editor.chain().focus().toggleCode().run(),
      isActive: editor.isActive("code"),
      title: "Inline Code",
    },
    {
      icon: Code2,
      action: () => editor.chain().focus().toggleCodeBlock().run(),
      isActive: editor.isActive("codeBlock"),
      title: "Code Block",
    },
    null,
    {
      icon: Link,
      action: setLink,
      isActive: editor.isActive("link"),
      title: "Add Link",
    },
    {
      icon: Minus,
      action: () => editor.chain().focus().setHorizontalRule().run(),
      isActive: false,
      title: "Horizontal Rule",
    },
    null,
    {
      icon: Undo,
      action: () => editor.chain().focus().undo().run(),
      isActive: false,
      title: "Undo (Ctrl+Z)",
      disabled: !editor.can().undo(),
    },
    {
      icon: Redo,
      action: () => editor.chain().focus().redo().run(),
      isActive: false,
      title: "Redo (Ctrl+Shift+Z)",
      disabled: !editor.can().redo(),
    },
  ]

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: "2px",
        padding: "8px 12px",
        borderBottom: "1px solid #e2e8f0",
        background: "#f8fafc",
      }}
    >
      {tools.map((tool, i) => {
        if (tool === null) {
          return (
            <div
              key={`sep-${i}`}
              style={{
                width: "1px",
                height: "24px",
                background: "#e2e8f0",
                margin: "0 4px",
              }}
            />
          )
        }

        const Icon = tool.icon
        return (
          <button
            key={i}
            onClick={tool.action}
            disabled={tool.disabled}
            title={tool.title}
            style={{
              width: "32px",
              height: "32px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "6px",
              border: "none",
              cursor: tool.disabled ? "not-allowed" : "pointer",
              background: tool.isActive ? "#dbeafe" : "transparent",
              color: tool.isActive ? "#2563eb" : "#64748b",
              opacity: tool.disabled ? 0.4 : 1,
              transition: "all 0.1s",
            }}
            onMouseEnter={(e) => {
              if (!tool.disabled && !tool.isActive) {
                e.currentTarget.style.background = "#f1f5f9"
              }
            }}
            onMouseLeave={(e) => {
              if (!tool.isActive) {
                e.currentTarget.style.background = "transparent"
              }
            }}
          >
            <Icon style={{ width: "15px", height: "15px" }} />
          </button>
        )
      })}
    </div>
  )
}
