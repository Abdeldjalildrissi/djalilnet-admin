import fs from "fs";
import path from "path";
import { db } from "@/db";
import { experiences, educations, skills, siteSettings } from "@/db/schema";
import { asc, desc, eq } from "drizzle-orm";

/**
 * Escapes special LaTeX characters in strings
 */
function escapeLatex(text: string): string {
  if (!text) return "";
  return text
    .replace(/\\/g, "\\textbackslash{}")
    .replace(/&/g, "\\&")
    .replace(/%/g, "\\%")
    .replace(/\$/g, "\\$")
    .replace(/#/g, "\\#")
    .replace(/_/g, "\\_")
    .replace(/\{/g, "\\{")
    .replace(/\}/g, "\\}")
    .replace(/~/g, "\\textasciitilde{}")
    .replace(/\^/g, "\\textasciicircum{}");
}

export async function generateResumePDF(): Promise<Buffer> {
  // 1. Fetch ALL Data
  const [exps, edus, allSkills, settings] = await Promise.all([
    db.query.experiences.findMany({
      orderBy: [asc(experiences.order), desc(experiences.createdAt)],
    }),
    db.query.educations.findMany({
      orderBy: [asc(educations.order)],
    }),
    db.query.skills.findMany({
      orderBy: [asc(skills.order)],
    }),
    db.query.siteSettings.findFirst({
      where: eq(siteSettings.key, "personal_info"),
    }),
  ]);

  const personalInfo = (settings?.value as Record<string, unknown>) || {};

  // 2. Generate LaTeX string blocks

  // Experiences
  let experiencesLatex = "";
  for (const exp of exps) {
    const titleLine = `\\textbf{${escapeLatex(exp.role)} | ${escapeLatex(exp.company)} (${escapeLatex(exp.period)}) ${exp.location ? escapeLatex(exp.location) : ""}}\n`;
    let bulletsLatex = "\\begin{itemize}[label=$\\bullet$]\n";
    if (Array.isArray(exp.bullets)) {
      exp.bullets.forEach((bullet: string) => {
        bulletsLatex += `    \\item ${escapeLatex(bullet)}\n`;
      });
    }
    bulletsLatex += "\\end{itemize}\n\n";
    experiencesLatex += titleLine + bulletsLatex;
  }

  // Education
  let educationLatex = "";
  for (const edu of edus) {
    educationLatex += `\\item \\textbf{${escapeLatex(edu.degree)}} (${escapeLatex(edu.period)}) | ${escapeLatex(edu.school)}\n`;
  }

  // Skills grouped by category
  const softSkills = allSkills
    .filter((s) => s.category === "technical")
    .map((s) => `\\item ${escapeLatex(s.name)}`)
    .join("\n");
  const softwareSkills = allSkills
    .filter((s) => s.category === "software")
    .map((s) => `\\item ${escapeLatex(s.name)}`)
    .join("\n");
  const languageSkills = allSkills
    .filter((s) => s.category === "language")
    .map((s) => `\\item ${escapeLatex(s.name)}`)
    .join("\n");

  // 3. Read template and inject blocks
  const templatePath = path.join(process.cwd(), "..", "cv-latex.txt");
  let templateContent = "";

  try {
    templateContent = fs.readFileSync(templatePath, "utf-8");
  } catch {
    try {
      templateContent = fs.readFileSync(
        path.join(process.cwd(), "cv-latex.txt"),
        "utf-8",
      );
    } catch {
      throw new Error(`Could not find cv-latex.txt template.`);
    }
  }

  // Inject Data
  const compiledTex = templateContent
    .replace(
      "<<NAME>>",
      escapeLatex((personalInfo.name as string) || "DRISSI Abdeldjalil"),
    )
    .replace(
      "<<ROLE>>",
      escapeLatex(
        (personalInfo.role as string) || "Electromechanical Engineer",
      ),
    )
    .replace(
      "<<MOB>>",
      escapeLatex((personalInfo.phone as string) || "+213 790750708"),
    )
    .replace(
      "<<MAIL>>",
      escapeLatex(
        (personalInfo.email as string) || "abdeldjalildrissi@gmail.com",
      ),
    )
    .replace(
      "<<ADDRESS>>",
      escapeLatex((personalInfo.location as string) || "Algeria"),
    )
    .replace("<<SUMMARY>>", escapeLatex((personalInfo.tagline as string) || ""))
    .replace("<<SOFT_SKILLS>>", softSkills)
    .replace("<<SOFTWARE_SKILLS>>", softwareSkills)
    .replace("<<LANGUAGE_SKILLS>>", languageSkills)
    .replace("<<EXPERIENCES_LIST>>", experiencesLatex)
    .replace("<<EDUCATION_LIST>>", educationLatex);

  // 4. Compile via TexLive.net API (Robust for Serverless/Vercel)
  try {
    const payload = new URLSearchParams();
    payload.append("filecontents[]", compiledTex);
    payload.append("filename[]", "main.tex");
    payload.append("engine", "pdflatex");
    payload.append("return", "pdf");

    const res = await fetch("https://texlive.net/cgi-bin/latexcgi", {
      method: "POST",
      body: payload,
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("LaTeX Online Error:", errorText);
      throw new Error("LaTeX Online compilation failed.");
    }

    return Buffer.from(await res.arrayBuffer());
  } catch (err) {
    console.error("PDF Generation Fallback Triggered:", err);
    // Fallback: return the existing static PDF if API fails
    const fallbackPath = path.join(process.cwd(), "public", "resume.pdf");
    if (fs.existsSync(fallbackPath)) {
      return fs.readFileSync(fallbackPath);
    }
    throw err;
  }
}
