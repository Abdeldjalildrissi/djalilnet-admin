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
    .replace(/\^/g, "\\textasciicircum{}")
    .replace(/\|/g, "\\textbar{}")
    .replace(/</g, "\\textless{}")
    .replace(/>/g, "\\textgreater{}");
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

  // Inject Data - Using replaceAll to cover multiple occurrences (like in href)
  const compiledTex = templateContent
    .replaceAll("<<NAME>>", escapeLatex((personalInfo.name as string) || "DRISSI Abdeldjalil"))
    .replaceAll("<<ROLE>>", escapeLatex((personalInfo.role as string) || "Electromechanical Engineer"))
    .replaceAll("<<MOB>>", escapeLatex((personalInfo.phone as string) || "+213 790750708"))
    .replaceAll("<<MAIL>>", escapeLatex((personalInfo.email as string) || "abdeldjalildrissi@gmail.com"))
    .replaceAll("<<ADDRESS>>", escapeLatex((personalInfo.location as string) || "Algeria"))
    .replaceAll("<<SUMMARY>>", escapeLatex((personalInfo.tagline as string) || ""))
    .replaceAll("<<SOFT_SKILLS>>", softSkills)
    .replaceAll("<<SOFTWARE_SKILLS>>", softwareSkills)
    .replaceAll("<<LANGUAGE_SKILLS>>", languageSkills)
    .replaceAll("<<EXPERIENCES_LIST>>", experiencesLatex)
    .replaceAll("<<EDUCATION_LIST>>", educationLatex);

    // 4. Compile via TexLive.net API (Robust for Serverless/Vercel)
  try {
    const formData = new FormData();
    formData.append("filecontents[]", compiledTex);
    formData.append("filename[]", "document.tex");
    formData.append("engine", "pdflatex");
    formData.append("return", "pdf");

    const res = await fetch("https://texlive.net/cgi-bin/latexcgi", {
      method: "POST",
      body: formData,
    });

    const contentType = res.headers.get("content-type");
    if (!res.ok || (contentType && !contentType.includes("application/pdf"))) {
      const errorText = await res.text();
      console.error("LaTeX Compilation Error or non-PDF returned:", errorText);
      throw new Error(`LaTeX Online compilation failed: ${errorText.substring(0, 100)}...`);
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
