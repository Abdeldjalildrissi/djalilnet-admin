"use client"

import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query"
import { 
  ImageIcon, 
  ExternalLink, 
  Copy, 
  Search, 
  Grid, 
  List,
  Upload,
  MoreVertical,
  Check,
  Folder,
  Plus,
  Trash2,
  FolderOpen,
  ChevronRight,
  MoreHorizontal,
  FileText,
  Video
} from "lucide-react"
import { useState, useMemo } from "react"
import { UploadDropzone } from "@/lib/uploadthing"
import { useToast } from "@/hooks/use-toast"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface MediaItem {
  url: string
  type: string
  title: string
  id: string
  albumId?: string | null
}

interface Album {
  id: string
  name: string
  description?: string
  mediaCount: number
}

export default function MediaPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null)
  const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(null)
  const [isCreateAlbumOpen, setIsCreateAlbumOpen] = useState(false)
  const [newAlbumName, setNewAlbumName] = useState("")
  const [isMoveDialogOpen, setIsMoveDialogOpen] = useState(false)
  const [movingItemId, setMovingItemId] = useState<string | null>(null)
  const [targetAlbumId, setTargetAlbumId] = useState<string>("none")

  const queryClient = useQueryClient()
  const { toast } = useToast()

  const { data: media, isLoading: isMediaLoading } = useQuery<MediaItem[]>({
    queryKey: ["media-items"],
    queryFn: async () => {
      const res = await fetch("/api/media")
      if (!res.ok) throw new Error("Failed to fetch media")
      return res.json()
    },
  })

  const { data: albums, isLoading: isAlbumsLoading } = useQuery<Album[]>({
    queryKey: ["media-albums"],
    queryFn: async () => {
      const res = await fetch("/api/media/albums")
      if (!res.ok) throw new Error("Failed to fetch albums")
      return res.json()
    },
  })

  // Mutations
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/media/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete")
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["media-items"] })
      queryClient.invalidateQueries({ queryKey: ["media-albums"] })
      toast({ title: "Deleted", description: "Media item removed" })
    },
    onError: (err) => {
      toast({ variant: "destructive", title: "Error", description: err.message })
    }
  })

  const createAlbumMutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await fetch("/api/media/albums", {
        method: "POST",
        body: JSON.stringify({ name }),
      })
      if (!res.ok) throw new Error("Failed to create album")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["media-albums"] })
      setIsCreateAlbumOpen(false)
      setNewAlbumName("")
      toast({ title: "Success", description: "Album created" })
    },
    onError: (err) => {
      toast({ variant: "destructive", title: "Error", description: err.message })
    }
  })

  const moveMutation = useMutation({
    mutationFn: async ({ id, albumId }: { id: string; albumId: string | null }) => {
      const res = await fetch(`/api/media/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ albumId }),
      })
      if (!res.ok) throw new Error("Failed to move")
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["media-items"] })
      queryClient.invalidateQueries({ queryKey: ["media-albums"] })
      setIsMoveDialogOpen(false)
      setMovingItemId(null)
      toast({ title: "Updated", description: "Media moved successfully" })
    }
  })

  const filteredMedia = useMemo(() => {
    return media?.filter(item => {
      const matchesSearch = item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            item.type?.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesAlbum = selectedAlbumId === null || item.albumId === selectedAlbumId
      return matchesSearch && matchesAlbum
    })
  }, [media, searchTerm, selectedAlbumId])

  const currentAlbumName = selectedAlbumId 
    ? albums?.find(a => a.id === selectedAlbumId)?.name || "Album"
    : "All Media"

  const handleCopy = (url: string) => {
    navigator.clipboard.writeText(url)
    setCopiedUrl(url)
    setTimeout(() => setCopiedUrl(null), 2000)
  }

  const handleMoveClick = (item: MediaItem) => {
    setMovingItemId(item.id)
    setTargetAlbumId(item.albumId || "none")
    setIsMoveDialogOpen(true)
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: "2rem", minHeight: "calc(100vh - 100px)" }}>
      
      {/* Sidebar */}
      <aside style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        <div>
          <h3 style={{ fontSize: "0.75rem", fontWeight: "600", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.75rem" }}>
            Library
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <button
              onClick={() => setSelectedAlbumId(null)}
              style={{
                display: "flex", alignItems: "center", gap: "0.75rem",
                padding: "0.625rem 0.875rem", borderRadius: "0.5rem",
                background: selectedAlbumId === null ? "#eff6ff" : "transparent",
                color: selectedAlbumId === null ? "#1d4ed8" : "#475569",
                border: "none", cursor: "pointer", fontSize: "0.875rem", fontWeight: "500",
                width: "100%", textAlign: "left"
              }}
            >
              <Grid style={{ width: "18px", height: "18px" }} />
              All Assets
            </button>
          </div>
        </div>

        <div>
           <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
              <h3 style={{ fontSize: "0.75rem", fontWeight: "600", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", margin: 0 }}>
                Albums
              </h3>
              <Dialog open={isCreateAlbumOpen} onOpenChange={setIsCreateAlbumOpen}>
                <DialogTrigger asChild>
                  <button style={{ background: "none", border: "none", color: "#3b82f6", cursor: "pointer" }}>
                    <Plus style={{ width: "16px", height: "16px" }} />
                  </button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Album</DialogTitle>
                  </DialogHeader>
                  <div style={{ padding: "1rem 0" }}>
                    <Label htmlFor="album-name">Album Name</Label>
                    <Input 
                      id="album-name" 
                      value={newAlbumName} 
                      onChange={(e) => setNewAlbumName(e.target.value)}
                      placeholder="e.g. Portfolio Projects" 
                    />
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCreateAlbumOpen(false)}>Cancel</Button>
                    <Button onClick={() => createAlbumMutation.mutate(newAlbumName)} disabled={!newAlbumName || createAlbumMutation.isPending}>
                      Create Album
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
           </div>
           
           <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            {isAlbumsLoading ? (
               <p style={{ fontSize: "0.75rem", color: "#94a3b8", padding: "0 0.875rem" }}>Loading albums...</p>
            ) : albums?.map(album => (
              <button
                key={album.id}
                onClick={() => setSelectedAlbumId(album.id)}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "0.625rem 0.875rem", borderRadius: "0.5rem",
                  background: selectedAlbumId === album.id ? "#eff6ff" : "transparent",
                  color: selectedAlbumId === album.id ? "#1d4ed8" : "#475569",
                  border: "none", cursor: "pointer", fontSize: "0.875rem", fontWeight: "500",
                  width: "100%", textAlign: "left"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flex: 1 }}>
                  <Folder style={{ width: "18px", height: "18px", color: selectedAlbumId === album.id ? "#3b82f6" : "#94a3b8" }} />
                  {album.name}
                </div>
                <span style={{ fontSize: "0.75rem", opacity: 0.6 }}>{album.mediaCount}</span>
              </button>
            ))}
           </div>
        </div>
      </aside>

      {/* Main Content */}
      <main>
        <div style={{ marginBottom: "1.5rem" }}>
          <div>
            <h1 style={{ fontSize: "1.375rem", fontWeight: "700", margin: "0 0 0.5rem" }}>Media Library</h1>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#64748b", fontSize: "0.875rem", marginBottom: "0.25rem" }}>
              <FolderOpen style={{ width: "16px", height: "16px" }} />
              <span style={{ color: "#0f172a", fontWeight: "600" }}>{currentAlbumName}</span>
            </div>
          </div>
        </div>

        {/* Upload Dropzone */}
        <div style={{ marginBottom: "1.5rem" }}>
          <UploadDropzone
            endpoint="imageUploader"
            onClientUploadComplete={(res) => {
              queryClient.invalidateQueries({ queryKey: ["media-items"] })
              queryClient.invalidateQueries({ queryKey: ["media-albums"] })
              toast({ title: "Upload Complete", description: "Successfully added to the library" })
            }}
            onUploadError={(error: Error) => {
              toast({ variant: "destructive", title: "Upload Failed", description: error.message })
            }}
            appearance={{
              container: { border: "2px dashed #e2e8f0", background: "white", borderRadius: "0.75rem", padding: "2rem" },
              label: { color: "#3b82f6", fontWeight: "600" },
              button: { background: "#3b82f6" },
              allowedContent: { display: "none" }
            }}
          />
        </div>

        <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "0.75rem", padding: "1rem", marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
            <div style={{ position: "relative", flex: 1 }}>
              <Search style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", width: "16px", height: "16px", color: "#94a3b8" }} />
              <input 
                type="text" 
                placeholder="Search by filename or type..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ 
                  width: "100%", padding: "0.625rem 1rem 0.625rem 2.5rem", 
                  borderRadius: "0.5rem", border: "1px solid #e2e8f0", 
                  fontSize: "0.875rem", outline: "none"
                }}
              />
            </div>
          </div>
        </div>

        {isMediaLoading ? (
          <div style={{ padding: "4rem", textAlign: "center", color: "#94a3b8" }}>
             <p>Loading your masterpiece assets...</p>
          </div>
        ) : filteredMedia?.length === 0 ? (
          <div style={{ padding: "4rem", textAlign: "center", background: "#f8fafc", borderRadius: "0.75rem", border: "1px dashed #e2e8f0" }}>
             <FolderOpen style={{ width: "48px", height: "48px", color: "#cbd5e1", marginBottom: "1rem" }} />
             <p style={{ color: "#64748b", margin: 0 }}>No files in this view.</p>
          </div>
        ) : (
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", 
            gap: "1.5rem" 
          }}>
            {filteredMedia?.map((item) => (
              <div key={item.id} className="group" style={{ 
                background: "white", borderRadius: "12px", 
                border: "1px solid #e2e8f0", overflow: "hidden",
                position: "relative", transition: "all 0.2s ease"
              }}>
                <div style={{ 
                  aspectRatio: "1/1", background: "#f8fafc", 
                  display: "flex", alignItems: "center", justifyContent: "center",
                  overflow: "hidden", position: "relative"
                }}>
                  {item.type?.includes("pdf") ? (
                    <FileText style={{ width: "40px", height: "40px", color: "#ef4444" }} />
                  ) : item.type?.includes("video") ? (
                    <Video style={{ width: "40px", height: "40px", color: "#3b82f6" }} />
                  ) : item.url.startsWith("http") ? (
                    <img 
                      src={item.url} 
                      alt={item.title} 
                      style={{ width: "100%", height: "100%", objectFit: "cover" }} 
                    />
                  ) : (
                    <ImageIcon style={{ width: "40px", height: "40px", color: "#cbd5e1" }} />
                  )}
                  
                  {/* Overlay Actions */}
                  <div style={{
                    position: "absolute", inset: 0, background: "rgba(15, 23, 42, 0.4)",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
                    opacity: 0, transition: "opacity 0.2s", backdropFilter: "blur(2px)"
                  }} className="hover-overlay">
                    <button 
                      onClick={() => handleCopy(item.url)}
                      style={{ padding: "0.5rem", background: "white", borderRadius: "0.5rem", border: "none", cursor: "pointer" }}
                      title="Copy Link"
                    >
                      {copiedUrl === item.url ? <Check style={{ width: "16px", height: "16px", color: "#10b981" }} /> : <Copy style={{ width: "16px", height: "16px" }} />}
                    </button>
                    <button 
                      onClick={() => handleMoveClick(item)}
                      style={{ padding: "0.5rem", background: "white", borderRadius: "0.5rem", border: "none", cursor: "pointer" }}
                      title="Move to Album"
                    >
                      <Folder style={{ width: "16px", height: "16px", color: "#3b82f6" }} />
                    </button>
                    <button 
                      onClick={() => { if(confirm("Are you sure?")) deleteMutation.mutate(item.id) }}
                      style={{ padding: "0.5rem", background: "white", borderRadius: "0.5rem", border: "none", cursor: "pointer" }}
                      title="Delete"
                    >
                      <Trash2 style={{ width: "16px", height: "16px", color: "#ef4444" }} />
                    </button>
                  </div>
                </div>
                
                <div style={{ padding: "0.875rem" }}>
                  <p style={{ 
                    fontSize: "0.875rem", fontWeight: "600", color: "#0f172a", 
                    margin: "0 0 0.25rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" 
                  }}>
                    {item.title || "Untitled"}
                  </p>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "0.75rem", color: "#94a3b8", textTransform: "capitalize" }}>
                      {item.type.includes('/') ? item.type.split('/')[1] : item.type}
                    </span>
                    <button 
                      onClick={() => window.open(item.url, "_blank")}
                      style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer" }}
                    >
                      <ExternalLink style={{ width: "14px", height: "14px" }} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Move Dialog */}
      <Dialog open={isMoveDialogOpen} onOpenChange={setIsMoveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Move to Album</DialogTitle>
          </DialogHeader>
          <div style={{ padding: "1rem 0" }}>
            <Label>Target Album</Label>
            <Select value={targetAlbumId} onValueChange={setTargetAlbumId}>
              <SelectTrigger>
                <SelectValue placeholder="Select an album" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Album (Unorganized)</SelectItem>
                {albums?.map(a => (
                  <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsMoveDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={() => moveMutation.mutate({ 
                id: movingItemId!, 
                albumId: targetAlbumId === "none" ? null : targetAlbumId 
              })}
              disabled={moveMutation.isPending}
            >
              Move File
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Basic HOVER CSS */}
      <style jsx global>{`
        .group:hover .hover-overlay {
          opacity: 1 !important;
        }
      `}</style>
    </div>
  )
}
