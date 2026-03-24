"use client"

import { useState, useCallback } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Plus, Pencil, Trash2, Loader2, Save, X, Eye, Code, FileText, Layout, Info } from "lucide-react"
import { formatRelativeTime } from "@/lib/utils"
import { RichTextEditor } from "@/components/editor/rich-text-editor"
import type { JSONContent } from "@tiptap/react"

interface Template {
  id: string
  name: string
  subject: string
  bodyHtml: string
  variables: string[]
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
  const [viewMode, setViewMode] = useState<"edit" | "preview">("edit")

  const { data, isLoading } = useQuery<{ data: Template[] }>({
    queryKey: ["email-templates"],
    queryFn: () => fetch("/api/email/templates").then((r) => r.json()),
  })

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
      await fetch(`/api/email/templates/${id}`, { method: "DELETE" })
      queryClient.invalidateQueries({ queryKey: ["email-templates"] })
    } catch (err) {
      alert("Error deleting template")
    }
  }

  const resetForm = () => {
    setShowForm(false)
    setEditingId(null)
    setName(""); setSubject(""); setBodyHtml("")
    setViewMode("edit")
  }

  const startEdit = (template: Template) => {
    setEditingId(template.id)
    setName(template.name)
    setSubject(template.subject)
    setBodyHtml(template.bodyHtml)
    setShowForm(true)
  }

  const handleEditorChange = useCallback((_: JSONContent, html: string) => {
    setBodyHtml(html)
  }, [])

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Layout className="text-blue-600 w-6 h-6" />
            Email Templates
          </h1>
          <p className="text-slate-500 mt-1">Design beautiful, reusable email structures</p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all shadow-md shadow-blue-500/10 font-semibold"
          >
            <Plus className="w-5 h-5" />
            New Template
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <div className="flex items-center gap-4">
               <h3 className="text-lg font-bold text-slate-800">
                {editingId ? "Edit Template" : "Create New Template"}
              </h3>
              <div className="flex bg-slate-200/60 p-1 rounded-lg">
                <button 
                  onClick={() => setViewMode("edit")}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold transition-all ${viewMode === 'edit' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  <Code className="w-3.5 h-3.5" /> EDITOR
                </button>
                <button 
                  onClick={() => setViewMode("preview")}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold transition-all ${viewMode === 'preview' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  <Eye className="w-3.5 h-3.5" /> PREVIEW
                </button>
              </div>
            </div>
            <button onClick={resetForm} className="text-slate-400 hover:text-slate-600 transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>
          
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Template Name</label>
                <input 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  placeholder="e.g. Welcome Series - Day 1" 
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-medium"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Default Subject Line</label>
                <input 
                  value={subject} 
                  onChange={(e) => setSubject(e.target.value)} 
                  placeholder="Subject (use {{name}} for dynamic data)" 
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-medium"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email Body</label>
              {viewMode === "edit" ? (
                <div className="border border-slate-200 rounded-2xl overflow-hidden ring-1 ring-slate-100">
                  <RichTextEditor
                    content={bodyHtml || null}
                    onChange={handleEditorChange}
                    placeholder="Start designing your template content here..."
                    minHeight="450px"
                  />
                </div>
              ) : (
                <div className="border border-slate-200 rounded-2xl p-8 min-h-[450px] bg-slate-50 flex justify-center">
                  <div className="bg-white w-full max-w-2xl shadow-sm border border-slate-100 p-10 prose prose-slate">
                    <div className="mb-8 pb-4 border-b border-slate-100">
                      <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">Subject Preview</p>
                      <h2 className="text-lg font-bold text-slate-800 m-0">{subject || "No subject set"}</h2>
                    </div>
                    <div dangerouslySetInnerHTML={{ __html: bodyHtml }} />
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold p-2 px-4 bg-slate-50 rounded-lg border border-slate-100 mt-2">
                <Info className="w-3.5 h-3.5 text-blue-500" />
                TIP: VARIABLES WILL BE AUTOMATICALLY DETECTED BASED ON THE {"{{variable_name}}"} SYNTAX.
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={handleSave}
                disabled={isSaving || !name || !subject || !bodyHtml}
                className="flex items-center gap-2 px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl disabled:opacity-50 font-bold transition-all shadow-lg shadow-blue-500/20"
              >
                {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                {editingId ? "Update Template" : "Save Template"}
              </button>
              <button
                onClick={resetForm}
                className="px-8 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Templates list */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-20 text-center text-slate-400">
            <Loader2 className="w-10 h-10 animate-spin mx-auto mb-6 opacity-20" />
            <p className="font-medium">Loading your design library...</p>
          </div>
        ) : !data?.data || data.data.length === 0 ? (
          <div className="p-20 text-center text-slate-400">
            <FileText className="w-16 h-16 mx-auto mb-6 opacity-5" />
            <h3 className="text-slate-900 font-semibold mb-1 text-lg">Your template library is empty</h3>
            <p className="max-w-xs mx-auto text-sm">Templates allow you to reuse proven designs and save time on every campaign.</p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-8 inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-md shadow-blue-500/10"
            >
              <Plus className="w-4 h-4" />
              Create Template
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0 divide-x divide-y divide-slate-100">
            {data.data.map((template) => (
              <div key={template.id} className="p-6 hover:bg-slate-50/50 transition-all group relative">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-all">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => startEdit(template)}
                      className="p-2 bg-white border border-slate-200 rounded-lg text-slate-500 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm"
                      title="Edit Template"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(template.id)}
                      className="p-2 bg-white border border-slate-200 rounded-lg text-slate-500 hover:text-rose-600 hover:border-rose-200 transition-all shadow-sm"
                      title="Delete Template"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-bold text-slate-900 truncate">{template.name}</h4>
                  <p className="text-xs text-slate-500 line-clamp-1 italic font-medium">"{template.subject}"</p>
                </div>

                <div className="mt-6 flex items-center justify-between">
                  <div className="flex flex-wrap gap-1">
                    {template.variables?.length > 0 ? (
                      template.variables.slice(0, 3).map((v) => (
                        <span key={v} className="px-1.5 py-0.5 bg-slate-100 text-[10px] font-bold text-slate-500 rounded uppercase tracking-tighter border border-slate-200/50">
                          {v}
                        </span>
                      ))
                    ) : (
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Static Content</span>
                    )}
                    {template.variables?.length > 3 && (
                      <span className="text-[10px] text-slate-400 font-bold">+{template.variables.length - 3} more</span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-300 font-bold uppercase tracking-widest">
                    {formatRelativeTime(template.createdAt)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
