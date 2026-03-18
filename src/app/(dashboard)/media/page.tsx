"use client"

import { useQuery } from "@tanstack/react-query"
import { 
  ImageIcon, 
  ExternalLink, 
  Copy, 
  Search, 
  Grid, 
  List,
  Upload,
  MoreVertical,
  Check
} from "lucide-react"
import { useState } from "react"
import { UploadButton } from "@/lib/uploadthing"
import { useQueryClient } from "@tanstack/react-query"
import { useToast } from "@/hooks/use-toast"

interface MediaItem {
  url: string
  type: string
  title: string
  id: string
}

export default function MediaPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null)
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const { data: media, isLoading } = useQuery<MediaItem[]>({
    queryKey: ["media-items"],
    queryFn: async () => {
      const res = await fetch("/api/media")
      if (!res.ok) throw new Error("Failed to fetch media")
      return res.json()
    },
  })

  const filteredMedia = media?.filter(item => 
    item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.type?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleCopy = (url: string) => {
    navigator.clipboard.writeText(url)
    setCopiedUrl(url)
    setTimeout(() => setCopiedUrl(null), 2000)
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontSize: "1.375rem", fontWeight: "700", margin: "0 0 0.25rem" }}>Media Library</h1>
          <p style={{ color: "#64748b", fontSize: "0.875rem", margin: 0 }}>Manage assets across the entire platform</p>
        </div>
        <UploadButton
          endpoint="imageUploader"
          onClientUploadComplete={() => {
            queryClient.invalidateQueries({ queryKey: ["media-items"] })
            toast({
              title: "Upload Complete",
              description: "New media added to library",
            })
          }}
          onUploadError={(error: Error) => {
            toast({
              variant: "destructive",
              title: "Upload Failed",
              description: error.message,
            })
          }}
          appearance={{
            button: {
              background: "var(--primary)",
              color: "white",
              fontSize: "0.875rem",
              fontWeight: "500",
              borderRadius: "0.5rem",
              padding: "0.5rem 1rem",
              height: "auto",
              width: "auto"
            },
            allowedContent: {
              display: "none"
            }
          }}
        />
      </div>

      <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "0.75rem", padding: "1rem", marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <div style={{ position: "relative", flex: 1 }}>
            <Search style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", width: "16px", height: "16px", color: "#94a3b8" }} />
            <input 
              type="text" 
              placeholder="Search media by title or source..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ 
                width: "100%", padding: "0.5rem 1rem 0.5rem 2.5rem", 
                borderRadius: "0.625rem", border: "1px solid #e2e8f0", 
                fontSize: "0.875rem" 
              }}
            />
          </div>
          <div style={{ display: "flex", border: "1px solid #e2e8f0", borderRadius: "0.5rem", overflow: "hidden" }}>
             <button style={{ padding: "0.5rem", background: "#f8fafc", border: "none" }}><Grid style={{ width: "16px", height: "16px", color: "#0f172a" }} /></button>
             <button style={{ padding: "0.5rem", background: "white", border: "none", borderLeft: "1px solid #e2e8f0" }}><List style={{ width: "16px", height: "16px", color: "#94a3b8" }} /></button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div style={{ padding: "4rem", textAlign: "center", color: "#94a3b8" }}>Loading gallery...</div>
      ) : filteredMedia?.length === 0 ? (
        <div style={{ padding: "4rem", textAlign: "center", background: "#f8fafc", borderRadius: "0.75rem", border: "1px dashed #e2e8f0" }}>
           <ImageIcon style={{ width: "48px", height: "48px", color: "#cbd5e1", marginBottom: "1rem" }} />
           <p style={{ color: "#64748b", margin: 0 }}>No media items found yet.</p>
        </div>
      ) : (
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", 
          gap: "1.25rem" 
        }}>
          {filteredMedia?.map((item, idx) => (
            <div key={idx} style={{ 
              background: "white", borderRadius: "10px", 
              border: "1px solid #e2e8f0", overflow: "hidden",
              transition: "transform 0.2s",
              cursor: "pointer",
              position: "relative"
            }}>
              <div style={{ 
                aspectRatio: "4/3", background: "#f1f5f9", 
                display: "flex", alignItems: "center", justifyContent: "center",
                overflow: "hidden"
              }}>
                {item.url.startsWith("http") ? (
                  <img 
                    src={item.url} 
                    alt={item.title} 
                    style={{ width: "100%", height: "100%", objectFit: "cover" }} 
                  />
                ) : (
                  <ImageIcon style={{ width: "32px", height: "32px", color: "#cbd5e1" }} />
                )}
              </div>
              <div style={{ padding: "0.75rem" }}>
                <p style={{ 
                  fontSize: "0.8125rem", fontWeight: "600", color: "#0f172a", 
                  margin: "0 0 0.25rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" 
                }}>
                  {item.title || "Untitled"}
                </p>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                   <span style={{ fontSize: "0.6875rem", color: "#94a3b8", textTransform: "capitalize" }}>
                    {item.type.replace('_', ' ')}
                   </span>
                   <div style={{ display: "flex", gap: "0.25rem" }}>
                      <button 
                        onClick={() => handleCopy(item.url)}
                        style={{ padding: "0.25rem", background: "none", border: "none", cursor: "pointer", color: copiedUrl === item.url ? "#10b981" : "#94a3b8" }}
                      >
                        {copiedUrl === item.url ? <Check style={{ width: "14px", height: "14px" }} /> : <Copy style={{ width: "14px", height: "14px" }} />}
                      </button>
                      <button style={{ padding: "0.25rem", background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}>
                        <ExternalLink style={{ width: "14px", height: "14px" }} onClick={() => window.open(item.url, "_blank")} />
                      </button>
                   </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
