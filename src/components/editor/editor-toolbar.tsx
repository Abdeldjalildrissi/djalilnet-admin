"use client"

import type { Editor } from "@tiptap/react"
import { Bold, Italic, Underline as UnderlineIcon, Strikethrough, Heading1, Heading2, Heading3, List, ListOrdered, Quote, Code, Code2, Link, Undo, Redo, Minus, AlignLeft, AlignCenter, AlignRight, ImagePlus, Loader2 } from "lucide-react"
import { UploadButton } from "@/lib/uploadthing"

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
      icon: AlignLeft,
      action: () => editor.chain().focus().setTextAlign('left').run(),
      isActive: editor.isActive({ textAlign: 'left' }),
      title: "Align Left (Uncenter)",
    },
    {
      icon: AlignCenter,
      action: () => editor.chain().focus().setTextAlign('center').run(),
      isActive: editor.isActive({ textAlign: 'center' }),
      title: "Align Center",
    },
    {
      icon: AlignRight,
      action: () => editor.chain().focus().setTextAlign('right').run(),
      isActive: editor.isActive({ textAlign: 'right' }),
      title: "Align Right",
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
        gap: "4px",
        padding: "10px 16px",
        borderBottom: "1px solid #f1f5f9",
        background: "white",
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
              width: "34px",
              height: "34px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "8px",
              border: "none",
              cursor: tool.disabled ? "not-allowed" : "pointer",
              background: tool.isActive ? "#f0f0ff" : "transparent",
              color: tool.isActive ? "#6366f1" : "#64748b",
              opacity: tool.disabled ? 0.3 : 1,
              transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
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

      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center" }}>
        <UploadButton
          endpoint="emailAttachmentUploader"
          onClientUploadComplete={(res) => {
            res.forEach((file) => {
              if (file.type && file.type.startsWith("image/")) {
                editor.chain().focus().setImage({ src: file.url }).run()
              } else {
                editor
                  .chain()
                  .focus()
                  .setLink({ href: file.url, target: "_blank" })
                  .insertContent(`📎 ${file.name}`)
                  .run()
                // break link so typed text after isn't linked
                editor.chain().focus().unsetLink().insertContent(" ").run()
              }
            })
          }}
          appearance={{
            button: {
              height: "36px",
              padding: "0 16px",
              background: "linear-gradient(to right, #6366f1, #3b82f6)",
              color: "white",
              fontSize: "14px",
              fontWeight: "600",
              borderRadius: "8px",
              border: "none",
              cursor: "pointer",
              transition: "all 0.2s ease",
              boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
            },
            allowedContent: { display: "none" }
          }}
          content={{
            button({ ready, isUploading }) {
              if (isUploading) return (
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Loader2 className="animate-spin" style={{ width: "16px", height: "16px" }} />
                  <span>Uploading...</span>
                </div>
              );
              return (
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <ImagePlus style={{ width: "16px", height: "16px" }} />
                  <span>{ready ? "Insert Media" : "..."}</span>
                </div>
              );
            }
          }}
        />
      </div>
    </div>
  )
}
