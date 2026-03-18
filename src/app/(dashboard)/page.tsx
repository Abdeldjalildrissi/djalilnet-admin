"use client"

import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import {
  FileText,
  Eye,
  Mail,
  Users,
  TrendingUp,
  ArrowUpRight,
  Plus,
  Clock,
  XCircle,
  Send,
} from "lucide-react"
import { formatRelativeTime } from "@/lib/utils"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts"

interface Stats {
  articles: { total: number; published: number; draft: number }
  emails: { total: number; sent: number; failed: number }
  users: { total: number }
  recentActivity: Array<{
    id: string
    action: string
    resourceType: string
    createdAt: string
  }>
  activityData: Array<{
    name: string
    articles: number
    emails: number
  }>
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
  href,
}: {
  icon: React.ElementType
  label: string
  value: number | string
  sub?: string
  color: string
  href: string
}) {
  return (
    <Link href={href} style={{ textDecoration: "none" }}>
      <div className="stat-card" style={{ cursor: "pointer" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: "0.75rem",
          }}
        >
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "10px",
              background: color,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon style={{ width: "20px", height: "20px", color: "white" }} />
          </div>
          <ArrowUpRight
            style={{ width: "16px", height: "16px", color: "#94a3b8" }}
          />
        </div>
        <p
          style={{
            fontSize: "1.875rem",
            fontWeight: "700",
            color: "#0f172a",
            margin: "0 0 0.125rem",
          }}
        >
          {value}
        </p>
        <p style={{ fontSize: "0.875rem", color: "#64748b", margin: 0 }}>
          {label}
        </p>
        {sub && (
          <p
            style={{
              fontSize: "0.75rem",
              color: "#10b981",
              margin: "0.25rem 0 0",
              fontWeight: "500",
            }}
          >
            {sub}
          </p>
        )}
      </div>
    </Link>
  )
}

function ActionBadge({ action }: { action: string }) {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    "article.create": { label: "Created article", color: "#16a34a", bg: "#dcfce7" },
    "article.update": { label: "Updated article", color: "#2563eb", bg: "#dbeafe" },
    "article.delete": { label: "Deleted article", color: "#dc2626", bg: "#fef2f2" },
    "email.send": { label: "Sent email", color: "#7c3aed", bg: "#ede9fe" },
  }
  const info = map[action] ?? { label: action, color: "#64748b", bg: "#f1f5f9" }
  return (
    <span
      style={{
        padding: "2px 8px",
        borderRadius: "9999px",
        fontSize: "0.6875rem",
        fontWeight: "500",
        color: info.color,
        background: info.bg,
      }}
    >
      {info.label}
    </span>
  )
}

export default function DashboardPage() {
  const { data, isLoading } = useQuery<Stats>({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard/stats")
      if (!res.ok) throw new Error("Failed to load dashboard stats")
      return res.json()
    },
  })

  return (
    <div>
      {/* Page header */}
      <div className="flex flex-col md:flex-row md:justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 style={{ fontSize: "1.375rem", fontWeight: "700", margin: "0 0 0.25rem" }}>
            Dashboard
          </h1>
          <p style={{ color: "#64748b", fontSize: "0.875rem", margin: 0 }}>
            Welcome back — here&apos;s what&apos;s happening
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

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        <StatCard
          icon={FileText}
          label="Total Articles"
          value={isLoading ? "—" : data?.articles?.total ?? 0}
          sub={`${data?.articles?.draft ?? 0} drafts`}
          color="linear-gradient(135deg, #3b82f6, #6366f1)"
          href="/articles"
        />
        <StatCard
          icon={Eye}
          label="Published"
          value={isLoading ? "—" : data?.articles?.published ?? 0}
          color="linear-gradient(135deg, #10b981, #059669)"
          href="/articles?status=published"
        />
        <StatCard
          icon={Mail}
          label="Emails Received"
          value={isLoading ? "—" : data?.emails?.total ?? 0}
          color="linear-gradient(135deg, #f59e0b, #d97706)"
          href="/email/inbox"
        />
        <StatCard
          icon={Send}
          label="Emails Sent"
          value={isLoading ? "—" : data?.emails?.sent ?? 0}
          color="linear-gradient(135deg, #38bdf8, #0284c7)"
          href="/email/sent"
        />
        <StatCard
          icon={XCircle}
          label="Failed Emails"
          value={isLoading ? "—" : data?.emails?.failed ?? 0}
          color="linear-gradient(135deg, #ef4444, #b91c1c)"
          href="/email/sent?status=failed"
        />
        <StatCard
          icon={Users}
          label="Team Members"
          value={isLoading ? "—" : data?.users?.total ?? 0}
          color="linear-gradient(135deg, #8b5cf6, #7c3aed)"
          href="/users"
        />
      </div>

      {/* Activity Chart Section */}
      <div
        style={{
          background: "white",
          borderRadius: "0.75rem",
          border: "1px solid #e2e8f0",
          padding: "1.5rem",
          marginBottom: "1.5rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <TrendingUp style={{ width: "16px", height: "16px", color: "#3b82f6" }} />
            <h2 style={{ fontSize: "0.9375rem", fontWeight: "600", margin: 0 }}>
              7-Day Activity Breakdown
            </h2>
          </div>
          <div style={{ display: "flex", gap: "1rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
              <div style={{ width: "8px", height: "8px", borderRadius: "2px", background: "#3b82f6" }} />
              <span style={{ fontSize: "0.75rem", color: "#64748b" }}>Articles</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
              <div style={{ width: "8px", height: "8px", borderRadius: "2px", background: "#f59e0b" }} />
              <span style={{ fontSize: "0.75rem", color: "#64748b" }}>Emails</span>
            </div>
          </div>
        </div>
        <div style={{ width: "100%", height: "240px" }}>
          {isLoading ? (
            <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8" }}>
              Loading chart...
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.activityData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                />
                <Tooltip 
                  cursor={{ fill: "#f8fafc" }}
                  contentStyle={{ 
                    borderRadius: "8px", 
                    border: "1px solid #e2e8f0", 
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    fontSize: "12px"
                  }}
                />
                <Bar dataKey="articles" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={32} />
                <Bar dataKey="emails" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Recent Activity */}
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
              padding: "1rem 1.25rem",
              borderBottom: "1px solid #f1f5f9",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <Clock style={{ width: "16px", height: "16px", color: "#3b82f6" }} />
            <h2 style={{ fontSize: "0.9375rem", fontWeight: "600", margin: 0 }}>
              Recent Activity Logs
            </h2>
          </div>
          <div>
            {isLoading ? (
              <div style={{ padding: "2rem", textAlign: "center", color: "#94a3b8" }}>
                Loading...
              </div>
            ) : !data || !data.recentActivity || data.recentActivity.length === 0 ? (
              <div style={{ padding: "2rem", textAlign: "center", color: "#94a3b8" }}>
                No activity yet
              </div>
            ) : (
              data.recentActivity.slice(0, 8).map((log) => (
                <div
                  key={log.id}
                  style={{
                    padding: "0.75rem 1.25rem",
                    borderBottom: "1px solid #f8fafc",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <ActionBadge action={log.action} />
                  <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
                    {formatRelativeTime(log.createdAt)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Actions */}
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
              padding: "1rem 1.25rem",
              borderBottom: "1px solid #f1f5f9",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <Plus style={{ width: "16px", height: "16px", color: "#3b82f6" }} />
            <h2 style={{ fontSize: "0.9375rem", fontWeight: "600", margin: 0 }}>
              Quick Actions
            </h2>
          </div>
          <div style={{ padding: "1rem", display: "flex", flexDirection: "column", gap: "0.625rem" }}>
            {[
              { href: "/articles/new", label: "✍️  Write new article", desc: "Start with a blank document" },
              { href: "/email/compose", label: "📧  Compose email", desc: "Send to one or many recipients" },
              { href: "/email/inbox", label: "📥  Check inbox", desc: "View received messages" },
              { href: "/categories", label: "🏷️  Manage categories", desc: "Organize your content" },
              { href: "/users", label: "👥  Manage users", desc: "Team roles and permissions" },
            ].map((action) => (
              <Link
                key={action.href}
                href={action.href}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.125rem",
                  padding: "0.75rem",
                  borderRadius: "0.5rem",
                  border: "1px solid #f1f5f9",
                  background: "#fafafa",
                  textDecoration: "none",
                  transition: "all 0.15s",
                }}
              >
                <span style={{ fontSize: "0.875rem", fontWeight: "500", color: "#0f172a" }}>
                  {action.label}
                </span>
                <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
                  {action.desc}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
