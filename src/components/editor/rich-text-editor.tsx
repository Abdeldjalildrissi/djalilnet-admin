"use client"

import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Underline from "@tiptap/extension-underline"
import Link from "@tiptap/extension-link"
import Image from "@tiptap/extension-image"
import Placeholder from "@tiptap/extension-placeholder"
import CharacterCount from "@tiptap/extension-character-count"
import TextAlign from "@tiptap/extension-text-align"
import { EditorToolbar } from "./editor-toolbar"
import type { JSONContent } from "@tiptap/react"

interface RichTextEditorProps {
  content?: JSONContent | null
  onChange?: (content: JSONContent, html: string) => void
  placeholder?: string
  editable?: boolean
  maxChars?: number
  minHeight?: string
}

export function RichTextEditor({
  content,
  onChange,
  placeholder = "Start writing your article...",
  editable = true,
  maxChars,
  minHeight = "500px",
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        // Disabling these here because they are included in some StarterKit bundles,
        // and we want to configure them manually below to avoid duplicate warnings.
        codeBlock: false,
        link: false,
        underline: false,
      }),

      Underline,

      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-blue-600 underline cursor-pointer",
          rel: "noopener noreferrer",
          target: "_blank",
        },
      }),

      Image.configure({
        HTMLAttributes: { class: "rounded-lg max-w-full" },
        allowBase64: false,
      }),

      TextAlign.configure({ types: ["heading", "paragraph"] }),

      CharacterCount.configure({ limit: maxChars }),

      Placeholder.configure({
        placeholder,
        emptyEditorClass: "is-editor-empty",
      }),
    ],

    content: content ?? "",
    editable,
    immediatelyRender: false,

    onUpdate: ({ editor }) => {
      onChange?.(editor.getJSON(), editor.getHTML())
    },

    editorProps: {
      attributes: {
        style: `min-height: ${minHeight}; outline: none;`,
      },
    },
  })

  if (!editor) return null

  return (
    <div
      style={{
        border: "1px solid #e2e8f0",
        borderRadius: "0.5rem",
        overflow: "hidden",
        background: "white",
      }}
    >
      {editable && <EditorToolbar editor={editor} />}
      <EditorContent editor={editor} />
      {maxChars && (
        <div
          style={{
            padding: "6px 12px",
            borderTop: "1px solid #f1f5f9",
            fontSize: "0.75rem",
            color: "#94a3b8",
            textAlign: "right",
          }}
        >
          {editor.storage.characterCount.characters()} / {maxChars} characters
        </div>
      )}
    </div>
  )
}
