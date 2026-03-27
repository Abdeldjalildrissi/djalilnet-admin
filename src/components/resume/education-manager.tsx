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
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { 
  GraduationCap, 
  Calendar, 
  Loader2, 
  Plus, 
  Trash2, 
  Pencil,
  School
} from "lucide-react"

const educationSchema = z.object({
  id: z.string().optional(),
  degree: z.string().min(2, "Degree is required"),
  school: z.string().min(2, "School name is required"),
  period: z.string().min(2, "Period is required"),
  order: z.number(),
})

type Education = z.infer<typeof educationSchema>

export function EducationManager() {
  const [educations, setEducations] = useState<Education[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingEdu, setEditingEdu] = useState<Education | null>(null)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  const form = useForm<z.infer<typeof educationSchema>>({
    resolver: zodResolver(educationSchema),
    defaultValues: {
      degree: "",
      school: "",
      period: "",
      order: 0,
    },
  })

  useEffect(() => {
    fetchEducations()
  }, [])

  async function fetchEducations() {
    try {
      const res = await fetch("/api/profile/educations")
      const data = await res.json()
      setEducations(data)
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load education history.",
      })
    } finally {
      setLoading(false)
    }
  }

  function handleAdd() {
    setEditingEdu(null)
    form.reset({
      degree: "",
      school: "",
      period: "",
      order: educations.length,
    })
    setIsDialogOpen(true)
  }

  function handleEdit(edu: Education) {
    setEditingEdu(edu)
    form.reset(edu)
    setIsDialogOpen(true)
  }

  async function onSubmit(values: Education) {
    setSaving(true)
    try {
      const url = editingEdu 
        ? `/api/profile/educations/${editingEdu.id}` 
        : "/api/profile/educations"
      const method = editingEdu ? "PATCH" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      })

      if (!res.ok) throw new Error("Failed to save")

      toast({
        title: "Success",
        description: editingEdu ? "Education updated." : "Education added.",
      })
      
      setIsDialogOpen(false)
      fetchEducations()
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save education.",
      })
    } finally {
      setSaving(false)
    }
  }

  async function onDelete(id: string) {
    if (!confirm("Are you sure you want to delete this education entry?")) return

    try {
      const res = await fetch(`/api/profile/educations/${id}`, {
        method: "DELETE",
        credentials: "include",
      })

      if (!res.ok) throw new Error("Failed to delete")

      toast({
        title: "Deleted",
        description: "Education entry removed.",
      })
      fetchEducations()
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete education entry.",
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
          Add Education
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {educations.map((edu) => (
          <Card key={edu.id} className="bg-white/40 backdrop-blur-md border-white/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <GraduationCap className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-base">{edu.degree}</CardTitle>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" onClick={() => handleEdit(edu)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="text-destructive" onClick={() => onDelete(edu.id!)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <School className="h-3 w-3 text-muted-foreground" />
                  {edu.school}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  {edu.period}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-white/95 backdrop-blur-lg border-white/20">
          <DialogHeader>
            <DialogTitle>{editingEdu ? "Edit Education" : "Add Education"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="degree"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Degree / Diploma</FormLabel>
                    <FormControl>
                      <Input placeholder="B.Sc. Computer Science" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="school"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>School / University</FormLabel>
                    <FormControl>
                      <Input placeholder="Harvard University" {...field} value={field.value || ""} />
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
                      <Input placeholder="2018 – 2022" {...field} value={field.value || ""} />
                    </FormControl>
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
                  {editingEdu ? "Update" : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
