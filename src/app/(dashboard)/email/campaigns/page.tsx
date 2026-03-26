/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Plus, Loader2, Calendar, Target, CheckCircle2, AlertCircle, Clock, ChartBar, MoreVertical, Search, Send, FileText } from "lucide-react"
import Link from "next/link"
import { formatRelativeTime } from "@/lib/utils"

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
  template?: { name: string }
  sender?: { name: string; email: string }
}

export default function CampaignsPage() {
  const { data, isLoading } = useQuery<{ data: Campaign[] }>({
    queryKey: ["email-campaigns"],
    queryFn: () => fetch("/api/email/campaigns").then((r) => r.json()),
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-emerald-100 text-emerald-700 border-emerald-200"
      case "processing": return "bg-blue-100 text-blue-700 border-blue-200"
      case "scheduled": return "bg-amber-100 text-amber-700 border-amber-200"
      case "failed": return "bg-rose-100 text-rose-700 border-rose-200"
      default: return "bg-slate-100 text-slate-700 border-slate-200"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed": return <CheckCircle2 className="w-3.5 h-3.5" />
      case "processing": return <Loader2 className="w-3.5 h-3.5 animate-spin" />
      case "scheduled": return <Clock className="w-3.5 h-3.5" />
      case "failed": return <AlertCircle className="w-3.5 h-3.5" />
      default: return <Clock className="w-3.5 h-3.5" />
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Send className="text-blue-600" />
            Email Campaigns
          </h1>
          <p className="text-slate-500 mt-1">Schedule and monitor bulk email campaigns</p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/email/compose"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all shadow-sm ring-1 ring-blue-500/10"
          >
            <Plus className="w-4 h-4" />
            Create Campaign
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-500">Total Campaigns</p>
              <h2 className="text-3xl font-bold text-slate-900">{data?.data?.length || 0}</h2>
            </div>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><ChartBar className="w-5 h-5" /></div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-500">Sent Success</p>
              <h2 className="text-3xl font-bold text-slate-900">
                {data?.data?.reduce((acc, c) => acc + c.sentRecipients, 0) || 0}
              </h2>
            </div>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><CheckCircle2 className="w-5 h-5" /></div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-500">Failed</p>
              <h2 className="text-3xl font-bold text-slate-900 text-rose-600">
                {data?.data?.reduce((acc, c) => acc + c.failedRecipients, 0) || 0}
              </h2>
            </div>
            <div className="p-2 bg-rose-50 text-rose-600 rounded-lg"><AlertCircle className="w-5 h-5" /></div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-500">Scheduled</p>
              <h2 className="text-3xl font-bold text-slate-900 text-amber-600">
                {data?.data?.filter(c => c.status === 'scheduled').length || 0}
              </h2>
            </div>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg"><Clock className="w-5 h-5" /></div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-16 text-center text-slate-400">
            <Loader2 className="w-10 h-10 animate-spin mx-auto mb-6 opacity-30" />
            <p className="font-medium">Loading your campaigns...</p>
          </div>
        ) : !data?.data || data.data.length === 0 ? (
          <div className="p-16 text-center text-slate-400">
            <Target className="w-16 h-16 mx-auto mb-6 opacity-10" />
            <h3 className="text-slate-900 font-semibold mb-1">No campaigns found</h3>
            <p className="max-w-xs mx-auto text-sm">Schedule your first marketing or notification campaign to reach your users.</p>
            <Link
              href="/email/compose"
              className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-all shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Create first campaign
            </Link>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest leading-non-zero">Campaign & Details</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest leading-non-zero">Scheduling</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest leading-non-zero">Progress</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest leading-non-zero">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest leading-non-zero text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.data.map((campaign) => (
                <tr key={campaign.id} className="hover:bg-slate-50/80 transition-all duration-200 group">
                  <td className="px-6 py-5">
                    <div className="space-y-1.5">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        {campaign.name}
                        {campaign.template && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 text-[10px] text-slate-600 font-semibold">
                            <FileText className="w-2.5 h-2.5" />
                            {campaign.template.name}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 font-medium truncate max-w-[240px]">
                        {campaign.subject}
                      </div>
                      <div className="text-[11px] text-slate-400 italic">
                        Sent from {campaign.sender?.name}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col gap-1.5">
                      <div className="text-xs font-bold text-slate-700 flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-blue-500" />
                        {campaign.scheduledAt ? new Date(campaign.scheduledAt).toLocaleDateString() : 'Instant'}
                      </div>
                      <div className="text-[11px] text-slate-400 font-medium flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5" />
                        {campaign.scheduledAt ? new Date(campaign.scheduledAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Upon creation'}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="space-y-2.5">
                      <div className="flex justify-between items-end">
                        <span className="text-xs font-bold text-slate-700">
                          {Math.round((campaign.sentRecipients / campaign.totalRecipients) * 100) || 0}%
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold">
                          {campaign.sentRecipients} / {campaign.totalRecipients}
                        </span>
                      </div>
                      <div className="h-1.5 w-32 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                        <div 
                          className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 rounded-full transition-all duration-1000" 
                          style={{ width: `${(campaign.sentRecipients / campaign.totalRecipients) * 100 || 0}%` }}
                        />
                      </div>
                      {campaign.failedRecipients > 0 && (
                        <div className="text-[10px] text-rose-500 font-bold flex items-center gap-1">
                          <AlertCircle className="w-2.5 h-2.5" />
                          {campaign.failedRecipients} failed
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-bold rounded-full border shadow-sm ${getStatusColor(campaign.status)}`}>
                      {getStatusIcon(campaign.status)}
                      <span className="uppercase tracking-widest">{campaign.status}</span>
                    </span>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <button className="p-2 text-slate-400 hover:text-slate-900 transition-colors">
                      <MoreVertical className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
