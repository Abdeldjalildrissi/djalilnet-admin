/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { 
  Briefcase, 
  Calendar, 
  ChevronRight, 
  Loader2, 
  MapPin, 
  Plus, 
  Trash2, 
  Pencil,
  GripVertical
} from "lucide-react"

const experienceSchema = z.object({
  id: z.string().optional(),
  company: z.string().min(2, "Company name is required"),
  role: z.string().min(2, "Role is required"),
  period: z.string().min(2, "Period is required"),
  location: z.string().optional().nullable(),
  current: z.boolean(),
  bullets: z.array(z.string()),
  order: z.number(),
})

type Experience = z.infer<typeof experienceSchema>

export function ExperienceManager() {
  const [experiences, setExperiences] = useState<Experience[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingExp, setEditingExp] = useState<Experience | null>(null)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  const form = useForm<z.infer<typeof experienceSchema>>({
    resolver: zodResolver(experienceSchema),
    defaultValues: {
      company: "",
      role: "",
      period: "",
      location: "",
      current: false,
      bullets: [],
      order: 0,
    },
  })

  useEffect(() => {
    fetchExperiences()
  }, [])

  async function fetchExperiences() {
    try {
      const res = await fetch("/api/profile/experiences")
      const data = await res.json()
      setExperiences(data)
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load experiences.",
      })
    } finally {
      setLoading(false)
    }
  }

  function handleAdd() {
    setEditingExp(null)
    form.reset({
      company: "",
      role: "",
      period: "",
      location: "",
      current: false,
      bullets: [],
      order: experiences.length,
    })
    setIsDialogOpen(true)
  }

  function handleEdit(exp: Experience) {
    setEditingExp(exp)
    form.reset(exp)
    setIsDialogOpen(true)
  }

  async function onSubmit(values: Experience) {
    setSaving(true)
    try {
      const url = editingExp 
        ? `/api/profile/experiences/${editingExp.id}` 
        : "/api/profile/experiences"
      const method = editingExp ? "PATCH" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      })

      if (!res.ok) throw new Error("Failed to save")

      toast({
        title: "Success",
        description: editingExp ? "Experience updated." : "Experience added.",
      })
      
      setIsDialogOpen(false)
      fetchExperiences()
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save experience.",
      })
    } finally {
      setSaving(false)
    }
  }

  async function onDelete(id: string) {
    if (!confirm("Are you sure you want to delete this experience?")) return

    try {
      const res = await fetch(`/api/profile/experiences/${id}`, {
        method: "DELETE",
      })

      if (!res.ok) throw new Error("Failed to delete")

      toast({
        title: "Deleted",
        description: "Experience removed successfully.",
      })
      fetchExperiences()
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete experience.",
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={handleAdd} className="bg-primary hover:bg-primary/90 text-white">
          <Plus className="mr-2 h-4 w-4" />
          Add Experience
        </Button>
      </div>

      {experiences.length === 0 ? (
        <Card className="bg-white/40 backdrop-blur-md border-white/20 border-dashed p-12 flex flex-col items-center justify-center text-center">
          <Briefcase className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No experience added yet</h3>
          <p className="text-muted-foreground max-w-sm">
            Add your professional history to showcase your journey.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {experiences.map((exp) => (
            <Card key={exp.id} className="bg-white border-white/20 hover:shadow-lg transition-all group overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <Briefcase className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{exp.role}</CardTitle>
                    <CardDescription className="font-medium text-foreground">
                      {exp.company}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(exp)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-destructive" onClick={() => onDelete(exp.id!)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {exp.period}
                  </div>
                  {exp.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {exp.location}
                    </div>
                  )}
                  {exp.current && (
                    <Badge variant="secondary" className="bg-success/10 text-success hover:bg-success/20 border-0">
                      Current
                    </Badge>
                  )}
                </div>
                <ul className="space-y-1">
                  {exp.bullets.map((bullet, i) => (
                    <li key={i} className="text-sm flex gap-2">
                      <ChevronRight className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl bg-white border-white/20 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingExp ? "Edit Experience" : "Add Experience"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4 pt-4">
                <FormField
                  control={form.control}
                  name="company"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company</FormLabel>
                      <FormControl>
                        <Input placeholder="Acme Inc." {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role</FormLabel>
                      <FormControl>
                        <Input placeholder="Senior Developer" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="period"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Period</FormLabel>
                      <FormControl>
                        <Input placeholder="Jan 2020 – Present" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input placeholder="New York, NY" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="current"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 bg-white/50">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Current Role</FormLabel>
                      <FormDescription>
                        Mark this if you are currently working in this position.
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              <div className="space-y-2">
                <FormLabel>Bullets (One per line)</FormLabel>
                <Textarea
                  placeholder="- Managed a team of 10 developers\n- Improved performance by 30%"
                  className="min-h-[120px] resize-none"
                  value={form.getValues("bullets")?.join("\n") || ""}
                  onChange={(e) => {
                    const bullets = e.target.value.split("\n").filter(line => line.trim() !== "")
                    form.setValue("bullets", bullets)
                  }}
                />
                <FormDescription>
                  List your key responsibilities and achievements.
                </FormDescription>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" type="button" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingExp ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
