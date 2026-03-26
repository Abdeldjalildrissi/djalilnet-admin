/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-unused-vars */
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { 
  Laptop, 
  Loader2, 
  Plus, 
  Trash2, 
  Settings,
  Globe,
  Star
} from "lucide-react"

const skillSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Skill name is required"),
  category: z.enum(["technical", "software", "language"]),
  level: z.number().min(0).max(100).optional(),
  order: z.number(),
})

type Skill = z.infer<typeof skillSchema>

export function SkillManager() {
  const [skills, setSkills] = useState<Skill[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  const form = useForm<z.infer<typeof skillSchema>>({
    resolver: zodResolver(skillSchema),
    defaultValues: {
      name: "",
      category: "technical",
      level: 100,
      order: 0,
    },
  })

  useEffect(() => {
    fetchSkills()
  }, [])

  async function fetchSkills() {
    try {
      const res = await fetch("/api/profile/skills")
      const data = await res.json()
      setSkills(data)
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load skills.",
      })
    } finally {
      setLoading(false)
    }
  }

  function handleAdd(category: "technical" | "software" | "language") {
    setEditingSkill(null)
    form.reset({
      name: "",
      category,
      level: 100,
      order: skills.filter(s => s.category === category).length,
    })
    setIsDialogOpen(true)
  }

  function handleEdit(skill: Skill) {
    setEditingSkill(skill)
    form.reset(skill)
    setIsDialogOpen(true)
  }

  async function onSubmit(values: Skill) {
    setSaving(true)
    try {
      const url = editingSkill 
        ? `/api/profile/skills/${editingSkill.id}` 
        : "/api/profile/skills"
      const method = editingSkill ? "PATCH" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      })

      if (!res.ok) throw new Error("Failed to save")

      toast({
        title: "Success",
        description: "Skill saved successfully.",
      })
      
      setIsDialogOpen(false)
      fetchSkills()
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save skill.",
      })
    } finally {
      setSaving(false)
    }
  }

  async function onDelete(id: string) {
    if (!confirm("Are you sure you want to delete this skill?")) return
    try {
      const res = await fetch(`/api/profile/skills/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete")
      toast({ title: "Deleted", description: "Skill removed." })
      fetchSkills()
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to delete skill." })
    }
  }

  const categories = [
    { key: "technical", label: "Technical Skills", icon: Laptop },
    { key: "software", label: "Software & Tools", icon: Settings },
    { key: "language", label: "Languages", icon: Globe },
  ] as const

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {categories.map((cat) => {
          const catSkills = skills.filter(s => s.category === cat.key)
          const Icon = cat.icon
          
          return (
            <Card key={cat.key} className="bg-white border-white/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    <Icon className="h-4 w-4" />
                  </div>
                  <CardTitle className="text-sm font-semibold">{cat.label}</CardTitle>
                </div>
                <Button variant="ghost" size="icon" onClick={() => handleAdd(cat.key)}>
                  <Plus className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {catSkills.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic">No skills added</p>
                  ) : (
                    catSkills.map(skill => (
                      <div 
                        key={skill.id}
                        className="group relative flex items-center gap-1.5 bg-white border border-white/30 px-3 py-1.5 rounded-full text-xs font-medium hover:bg-white/80 transition-colors"
                      >
                        {skill.name}
                        <button 
                          onClick={() => handleEdit(skill)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity ml-1"
                        >
                          <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                        </button>
                        <button 
                          onClick={() => onDelete(skill.id!)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:scale-110"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-white border-white/20">
          <DialogHeader>
            <DialogTitle>{editingSkill ? "Edit Skill" : "Add Skill"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Skill Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Next.js" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="technical">Technical</SelectItem>
                        <SelectItem value="software">Software</SelectItem>
                        <SelectItem value="language">Language</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingSkill ? "Update" : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
