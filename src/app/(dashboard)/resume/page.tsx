/* eslint-disable @typescript-eslint/no-unused-vars */
import { Metadata } from "next"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Briefcase, GraduationCap, Laptop, User } from "lucide-react"
import { ExperienceManager } from "@/components/resume/experience-manager"
import { EducationManager } from "@/components/resume/education-manager"
import { SkillManager } from "@/components/resume/skill-manager"
import { ProfileManager } from "@/components/resume/profile-manager"

export const metadata: Metadata = {
  title: "Resume Management | djalilnet Admin",
  description: "Manage your professional profile and resume data.",
}

export default function ResumePage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Resume Management</h1>
        <p className="text-muted-foreground">
          Update your professional profile, work experience, education, and skills.
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList className="bg-white border border-white/20 p-1">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="experience" className="flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            Experience
          </TabsTrigger>
          <TabsTrigger value="education" className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4" />
            Education
          </TabsTrigger>
          <TabsTrigger value="skills" className="flex items-center gap-2">
            <Laptop className="h-4 w-4" />
            Skills
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <ProfileManager />
        </TabsContent>

        <TabsContent value="experience" className="space-y-4">
          <ExperienceManager />
        </TabsContent>

        <TabsContent value="education" className="space-y-4">
          <EducationManager />
        </TabsContent>

        <TabsContent value="skills" className="space-y-4">
          <SkillManager />
        </TabsContent>
      </Tabs>
    </div>
  )
}
