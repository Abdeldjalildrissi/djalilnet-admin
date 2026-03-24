"use client"

import { useState, useCallback, Suspense, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useQuery, useMutation } from "@tanstack/react-query"
import { RichTextEditor } from "@/components/editor/rich-text-editor"
import { ArrowLeft, Send, Loader2, Paperclip, X, FileIcon, Calendar, Users, Info, Settings2 } from "lucide-react"
import Link from "next/link"
import type { JSONContent } from "@tiptap/react"
import { UploadButton } from "@/lib/uploadthing"

interface Template { id: string; name: string; subject: string; bodyHtml: string }
interface Sender { id: string; name: string; email: string; isActive: boolean }
interface Attachment { filename: string; url: string; size?: number }

function ComposeInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const draftId = searchParams.get("draftId")

  // Form State
  const [name, setName] = useState("") // Campaign Name
  const [recipientsStr, setRecipientsStr] = useState(searchParams.get("to") ?? "")
  const [senderId, setSenderId] = useState("")
  const [subject, setSubject] = useState(searchParams.get("subject") ?? "")
  const [templateId, setTemplateId] = useState("")
  const [bodyHtml, setBodyHtml] = useState("")
  const [scheduledAt, setScheduledAt] = useState("")
  const [isScheduled, setIsScheduled] = useState(false)
  const [attachments, setAttachments] = useState<Attachment[]>([])
  
  const [isSending, setIsSending] = useState(false)
  const [successMsg, setSuccessMsg] = useState("")
  const [error, setError] = useState("")

  // Fetch Data
  const { data: templatesData } = useQuery<{ data: Template[] }>({
    queryKey: ["email-templates"],
    queryFn: () => fetch("/api/email/templates").then((r) => r.json()),
  })

  const { data: sendersData } = useQuery<{ data: Sender[] }>({
    queryKey: ["email-senders"],
    queryFn: () => fetch("/api/email/senders").then((r) => r.json()),
  })

  useEffect(() => {
    if (sendersData?.data?.length && !senderId) {
      const activeSender = sendersData.data.find(s => s.isActive)
      if (activeSender) setSenderId(activeSender.id)
    }
  }, [sendersData, senderId])

  const handleTemplateChange = (id: string) => {
    setTemplateId(id)
    if (!id) return
    const template = templatesData?.data?.find((t) => t.id === id)
    if (template) {
      setSubject(template.subject)
      setBodyHtml(template.bodyHtml)
    }
  }

  const handleEditorChange = useCallback((_: JSONContent, html: string) => {
    setBodyHtml(html)
  }, [])

  const handleSubmit = async () => {
    setError("")
    setIsSending(true)
    
    // Parse recipients
    const recipients = recipientsStr
      .split(/[\n,;]/)
      .map(e => e.trim())
      .filter(e => e.length > 5 && e.includes("@"))

    if (recipients.length === 0) {
      setError("At least one valid recipient email is required.")
      setIsSending(false)
      return
    }

    try {
      const res = await fetch("/api/email/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name || `Campaign - ${new Date().toLocaleDateString()}`,
          subject,
          templateId: templateId || undefined,
          senderId,
          bodyHtml,
          scheduledAt: isScheduled ? scheduledAt : undefined,
          recipients,
        }),
      })

      if (res.ok) {
        setSuccessMsg(isScheduled ? "Campaign scheduled successfully!" : "Campaign created and sending started!")
        setTimeout(() => router.push("/email/campaigns"), 2000)
      } else {
        const data = await res.json()
        setError(data.error?.[0]?.message || data.error || "Failed to create campaign")
      }
    } catch (err) {
      setError("A network error occurred. Please try again.")
    } finally {
      setIsSending(false)
    }
  }

  if (successMsg) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-center animate-in fade-in zoom-in duration-300">
        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6 shadow-sm">
          <Send className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">{successMsg}</h2>
        <p className="text-slate-500">Redirecting you to the campaigns dashboard...</p>
        <div className="mt-8 w-48 h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-emerald-500 w-full animate-progress" />
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-4 border border-slate-200 rounded-xl shadow-sm">
        <div className="flex items-center gap-4">
          <Link href="/email/campaigns" className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Create Campaign</h1>
            <p className="text-xs text-slate-500">Set up a new bulk email broadcast</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleSubmit}
            disabled={isSending || !senderId || !subject || !bodyHtml || !recipientsStr}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-lg font-bold transition-all shadow-md shadow-blue-500/20 active:scale-95"
          >
            {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : (isScheduled ? <Calendar className="w-4 h-4" /> : <Send className="w-4 h-4" />)}
            {isSending ? "Processing..." : (isScheduled ? "Schedule Campaign" : "Send Now")}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-sm flex items-center gap-3 animate-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form Area */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-slate-500" />
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Campaign Content</span>
            </div>
            
            <div className="divide-y divide-slate-100">
               <div className="flex flex-col p-4 space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-tighter">Campaign Name (Internal)</label>
                <input 
                  value={name} 
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. March 2024 Newsletter"
                  className="w-full text-base font-medium outline-none placeholder:text-slate-300"
                />
              </div>

              <div className="flex flex-col p-4 space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-tighter">Email Subject</label>
                <input 
                  value={subject} 
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="What should users see in their inbox?"
                  className="w-full text-lg font-bold outline-none placeholder:text-slate-300"
                />
              </div>

              <div className="relative">
                <RichTextEditor
                  content={bodyHtml || null}
                  onChange={handleEditorChange}
                  placeholder="Design your email here... Use {{name}} for dynamic tags."
                  minHeight="500px"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Settings Area */}
        <div className="space-y-6">
          {/* Senders & Recipients */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
             <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
              <Users className="w-4 h-4 text-slate-500" />
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Audience & Identity</span>
            </div>
            
            <div className="p-5 space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Send From</label>
                <select 
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/20"
                  value={senderId}
                  onChange={(e) => setSenderId(e.target.value)}
                >
                  <option value="">Select a sender identity</option>
                  {sendersData?.data?.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.email})</option>
                  ))}
                </select>
                <Link href="/email/senders" className="text-[10px] text-blue-600 font-bold hover:underline flex items-center justify-end">
                  Manage Identities →
                </Link>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-end">
                  <label className="text-xs font-bold text-slate-500 uppercase">Recipients</label>
                  <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded-full font-bold text-slate-600">
                    {recipientsStr.split(/[\n,;]/).map(e => e.trim()).filter(e => e.includes("@")).length} Detected
                  </span>
                </div>
                <textarea 
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/20 h-40 resize-none font-mono"
                  placeholder="Paste emails separated by commas or new lines..."
                  value={recipientsStr}
                  onChange={(e) => setRecipientsStr(e.target.value)}
                />
                <p className="text-[10px] text-slate-400 leading-tight">
                  <Info className="w-3 h-3 inline mr-1" />
                  Duplicate and invalid emails will be automatically filtered.
                </p>
              </div>
            </div>
          </div>

          {/* Scheduling */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
             <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-500" />
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Scheduling</span>
            </div>
            
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-sm font-bold text-slate-700">Schedule for later?</span>
                <button 
                  onClick={() => setIsScheduled(!isScheduled)}
                  className={`w-12 h-6 rounded-full transition-all relative ${isScheduled ? 'bg-blue-600' : 'bg-slate-300'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isScheduled ? 'left-7' : 'left-1'}`} />
                </button>
              </div>

              {isScheduled && (
                <div className="space-y-2 animate-in slide-in-from-top-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Send Date & Time</label>
                  <input 
                    type="datetime-local"
                    className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-sm font-bold outline-none"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    min={new Date().toISOString().slice(0, 16)}
                  />
                  <p className="text-[10px] text-amber-600 font-medium">
                    Emails will start processing at the specified time.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Template Selection */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
             <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
              <FileIcon className="w-4 h-4 text-slate-500" />
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Templates</span>
            </div>
            
            <div className="p-5 space-y-4">
              <select 
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium outline-none"
                value={templateId}
                onChange={(e) => handleTemplateChange(e.target.value)}
              >
                <option value="">Choose a template...</option>
                {templatesData?.data?.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
              <p className="text-[10px] text-slate-400">
                Selecting a template will overwrite current subject and body content.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ComposePage() {
  return (
    <Suspense fallback={<div className="p-20 text-center"><Loader2 className="w-10 h-10 animate-spin mx-auto opacity-20" /></div>}>
      <ComposeInner />
    </Suspense>
  )
}

function AlertCircle(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  )
}
