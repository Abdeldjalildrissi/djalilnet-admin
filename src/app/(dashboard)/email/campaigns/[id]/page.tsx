"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { ArrowLeft, Loader2, CheckCircle2, AlertCircle, Clock, RefreshCw, Trash2, XCircle, Mail, Eye, Send, ExternalLink, User } from "lucide-react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { formatRelativeTime } from "@/lib/utils"

interface Recipient {
  id: string
  email: string
  status: string
  error: string | null
  openedAt: string | null
  processedAt: string | null
  attempts: number
}

interface Campaign {
  id: string
  name: string
  subject: string
  status: string
  totalRecipients: number
  sentRecipients: number
  failedRecipients: number
  scheduledAt: string | null
  createdAt: string
  bodyHtml: string
  template?: { name: string }
  sender?: { name: string; email: string }
  recipients: Recipient[]
}

export default function CampaignDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery<{ data: Campaign }>({
    queryKey: ["email-campaign", id],
    queryFn: () => fetch(`/api/email/campaigns/${id}`).then((r) => r.json()),
    refetchInterval: (query) => {
        const campaign = query.state.data?.data;
        return (campaign?.status === 'processing' || campaign?.status === 'scheduled') ? 5000 : false;
    }
  })

  const campaign = data?.data

  const handleAction = async (action: string) => {
    if (action === 'delete' && !confirm("Permanently delete this campaign and all its tracking data?")) return
    
    const res = await fetch(`/api/email/campaigns/${id}`, {
      method: action === 'delete' ? 'DELETE' : 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action })
    })

    if (res.ok) {
      if (action === 'delete') {
        router.push("/email/campaigns")
      } else {
        queryClient.invalidateQueries({ queryKey: ["email-campaign", id] })
      }
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "text-emerald-600 bg-emerald-50 border-emerald-100"
      case "processing": return "text-blue-600 bg-blue-50 border-blue-100"
      case "failed": return "text-rose-600 bg-rose-50 border-rose-100"
      case "cancelled": return "text-slate-500 bg-slate-50 border-slate-100"
      default: return "text-amber-600 bg-amber-50 border-amber-100"
    }
  }

  if (isLoading) return (
    <div className="p-20 text-center">
      <Loader2 className="w-10 h-10 animate-spin mx-auto opacity-20" />
      <p className="mt-4 text-slate-500 font-medium tracking-tight">Loading detailed analytics...</p>
    </div>
  )

  if (!campaign) return (
    <div className="p-20 text-center">
      <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
      <h2 className="text-xl font-bold">Campaign not found</h2>
      <Link href="/email/campaigns" className="mt-4 text-blue-600 hover:underline inline-block">Back to campaigns</Link>
    </div>
  )

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex gap-4">
          <Link href="/email/campaigns" className="p-2.5 hover:bg-slate-50 rounded-xl text-slate-400 border border-transparent hover:border-slate-100 transition-all">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900">{campaign.name}</h1>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusColor(campaign.status)}`}>
                {campaign.status}
              </span>
            </div>
            <p className="text-slate-500 text-sm mt-1">{campaign.subject}</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          {campaign.status === 'processing' && (
             <button 
              onClick={() => handleAction('cancel')}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-sm font-bold transition-all shadow-sm"
            >
              <XCircle className="w-4 h-4" /> Cancel Campaign
            </button>
          )}
          {campaign.status === 'failed' && (
             <button 
              onClick={() => handleAction('retry_failed')}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-xl text-sm font-bold transition-all shadow-md shadow-blue-500/20"
            >
              <RefreshCw className="w-4 h-4" /> Retry Failed
            </button>
          )}
          <button 
            onClick={() => handleAction('delete')}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-rose-100 text-rose-500 hover:bg-rose-50 rounded-xl text-sm font-bold transition-all shadow-sm"
          >
            <Trash2 className="w-4 h-4" /> Delete
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-widest">Sent / Total</span>
            <Send className="w-4 h-4" />
          </div>
          <div className="flex items-baseline gap-2">
            <h2 className="text-3xl font-black text-slate-900">{campaign.sentRecipients}</h2>
            <span className="text-slate-400 text-sm font-bold">/ {campaign.totalRecipients}</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-600 transition-all duration-1000" 
              style={{ width: `${(campaign.sentRecipients / campaign.totalRecipients) * 100}%` }}
            />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex justify-between items-center text-emerald-400">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Open Rate</span>
            <Eye className="w-4 h-4" />
          </div>
          <div className="flex items-baseline gap-2">
            <h2 className="text-3xl font-black text-emerald-600">
              {Math.round((campaign.recipients.filter(r => r.openedAt).length / campaign.totalRecipients) * 100) || 0}%
            </h2>
          </div>
          <p className="text-[10px] text-slate-400 font-bold uppercase">
             {campaign.recipients.filter(r => r.openedAt).length} unique opens
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex justify-between items-center text-rose-400">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Failure Rate</span>
            <AlertCircle className="w-4 h-4" />
          </div>
          <div className="flex items-baseline gap-2">
            <h2 className="text-3xl font-black text-rose-600">
              {Math.round((campaign.failedRecipients / campaign.totalRecipients) * 100) || 0}%
            </h2>
          </div>
           <p className="text-[10px] text-slate-400 font-bold uppercase">
             {campaign.failedRecipients} delivery errors
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-1">
           <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Campaign Details</span>
           <div className="space-y-1.5 pt-1">
             <div className="flex justify-between text-[11px] font-medium">
               <span className="text-slate-500">Sender:</span>
               <span className="text-slate-900 font-bold">{campaign.sender?.name}</span>
             </div>
             <div className="flex justify-between text-[11px] font-medium">
               <span className="text-slate-500">Template:</span>
               <span className="text-slate-900 font-bold">{campaign.template?.name || "None"}</span>
             </div>
             <div className="flex justify-between text-[11px] font-medium">
               <span className="text-slate-500">Created:</span>
               <span className="text-slate-900 font-bold">{formatRelativeTime(campaign.createdAt)}</span>
             </div>
           </div>
        </div>
      </div>

      {/* Recipients List */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden min-h-[400px]">
        <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <User className="w-4 h-4 text-blue-500" />
              Recipient Tracking
            </h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/30 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Sent At</th>
                <th className="px-6 py-4">Opened</th>
                <th className="px-6 py-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {campaign.recipients.map((recipient) => (
                <tr key={recipient.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-900 group flex items-center gap-2">
                       {recipient.email}
                       <Link href={`/email/compose?to=${recipient.email}`} className="opacity-0 group-hover:opacity-100 p-1 text-slate-300 hover:text-blue-500 transition-all">
                         <Mail className="w-3 h-3" />
                       </Link>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                      recipient.status === 'completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                      recipient.status === 'failed' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                      recipient.status === 'processing' ? 'bg-blue-50 text-blue-600 border-blue-100 animate-pulse' :
                      'bg-slate-100 text-slate-500 border-slate-200'
                    }`}>
                      {recipient.status === 'completed' ? <CheckCircle2 className="w-3 h-3" /> : 
                       recipient.status === 'failed' ? <AlertCircle className="w-3 h-3" /> : 
                       <Clock className="w-3 h-3" />}
                      {recipient.status.toUpperCase()}
                    </span>
                    {recipient.error && (
                      <p className="text-[10px] text-rose-400 mt-1 font-medium truncate max-w-[200px]" title={recipient.error}>
                        {recipient.error}
                      </p>
                    )}
                  </td>
                  <td className="px-6 py-4 text-xs font-medium text-slate-500">
                    {recipient.processedAt ? formatRelativeTime(recipient.processedAt) : "—"}
                  </td>
                  <td className="px-6 py-4">
                    {recipient.openedAt ? (
                      <div className="flex flex-col">
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                          <Eye className="w-3 h-3" /> YES
                        </span>
                        <span className="text-[9px] text-slate-300 font-bold">{formatRelativeTime(recipient.openedAt)}</span>
                      </div>
                    ) : (
                      <span className="text-[10px] font-bold text-slate-300">NO</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">
                       {recipient.attempts} {recipient.attempts === 1 ? 'attempt' : 'attempts'}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Campaign Content Preview */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Content Summary</h3>
            <button className="text-[10px] font-black text-blue-600 hover:underline uppercase flex items-center gap-1">
              View full snapshot <ExternalLink className="w-2.5 h-2.5" />
            </button>
        </div>
        <div className="p-6">
           <div className="bg-slate-100 rounded-xl p-8 max-w-2xl mx-auto border border-slate-200/50">
             <div className="bg-white shadow-xl border border-slate-100 p-8 text-slate-800 text-sm line-clamp-[10] overflow-hidden whitespace-pre-wrap break-words">
               <div dangerouslySetInnerHTML={{ __html: campaign.bodyHtml }} />
             </div>
           </div>
        </div>
      </div>
    </div>
  )
}
