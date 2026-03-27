import fs from "fs";
import path from "path";
import { db } from "@/db";
import {
  experiences,
  educations,
  certifications,
  skills,
  siteSettings,
} from "@/db/schema";
import { asc, desc, eq } from "drizzle-orm";

/**
 * Escapes special LaTeX characters for use in TEXT content only.
 * DO NOT use this for URLs (mailto:, href arguments) or raw LaTeX commands.
 *
 * Uses a two-pass approach with safe placeholders (no underscores or special chars).
 * This prevents double-escaping and substring corruption.
 */
function escapeLatex(text: string): string {
  if (!text) return "";

  // Map of character → LaTeX command (using unique placeholders with NO underscores)
  const replacements: [RegExp, string, string][] = [
    [/\\/g, "BKSLPH", "\\textbackslash{}"],
    [/\{/g, "LBRACEPH", "\\{"],
    [/\}/g, "RBRACEPH", "\\}"],
    [/&/g, "AMPPH", "\\&"],
    [/\$/g, "DOLLARPH", "\\$"],
    [/%/g, "PERCENTPH", "\\%"],
    [/#/g, "HASHPH", "\\#"],
    [/_/g, "UNDERPH", "\\_"],
    [/~/g, "TILDEPH", "\\textasciitilde{}"],
    [/\^/g, "CARETPH", "\\textasciicircum{}"],
    [/\|/g, "PIPEPH", "\\textbar{}"],
    [/</g, "LTPH", "\\textless{}"],
    [/>/g, "GTPH", "\\textgreater{}"],
  ];

  // Pass 1: replace all special chars with unique placeholders
  let result = text;
  for (const [regex, placeholder] of replacements) {
    result = result.replace(regex, placeholder);
  }

  // Pass 2: replace all placeholders with LaTeX sequences
  for (const [, placeholder, latexCmd] of replacements) {
    result = result.split(placeholder).join(latexCmd);
  }

  return result;
}

export async function generateResumePDF(): Promise<Buffer> {
  // 1. Fetch ALL Data
  const [exps, edus, certs, allSkills, settings] = await Promise.all([
    db.query.experiences.findMany({
      orderBy: [asc(experiences.order), desc(experiences.createdAt)],
    }),
    db.query.educations.findMany({
      orderBy: [asc(educations.order)],
    }),
    db.query.certifications.findMany({
      orderBy: [asc(certifications.order)],
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
    const role = escapeLatex(exp.role);
    const company = escapeLatex(exp.company);
    const period = escapeLatex(exp.period).replace(/–/g, "--");
    const location = exp.location ? escapeLatex(exp.location) : "";

    // Fix for Margin Bleed: Do NOT wrap the entire line in \textbf{...}
    // We split it so LaTeX can wrap naturally and use \hfill to push date/location right
    const titleLine = `\\noindent\\textbf{${role}} \\textbar{} ${company} \\hfill \\textit{${period} --- ${location}}\n`;
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
    const degree = escapeLatex(edu.degree);
    const school = escapeLatex(edu.school);
    const period = escapeLatex(edu.period).replace(/–/g, "--");
    educationLatex += `\\item \\textbf{${degree}} \\hfill \\textit{${period}} \\\\ ${school}\n`;
  }

  // Certifications
  let certificationsLatex = "";
  if (certs && certs.length > 0) {
    certificationsLatex = "\\section*{Certificates and Attestation}\n\\begin{itemize}[label=$\\bullet$]\n";
    for (const cert of certs) {
      const name = escapeLatex(cert.name);
      const org = escapeLatex(cert.organization);
      const date = cert.issueDate ? escapeLatex(cert.issueDate).replace(/–/g, "--") : "";
      const url = cert.credentialUrl ? cert.credentialUrl : "";
      const dateStr = date ? `(${date})` : "";
      
      let certLine = `\\item \\textbf{${name} --- ${org}} \\hfill \\textit{${dateStr}}\n`;
      if (url) {
        // Safe link injection
        certLine = `\\item \\textbf{\\href{${url}}{${name}} --- ${org}} \\hfill \\textit{${dateStr}}\n`;
      }
      certificationsLatex += certLine;
    }
    certificationsLatex += "\\end{itemize}\n";
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

  // Since there is no Hobbies table, we safely omit it.
  const hobbiesSection = "";

  // 3. Read template
  const candidates = [
    path.join(process.cwd(), "src", "lib", "cv-latex.txt"),
    path.join(process.cwd(), "cv-latex.txt"),
    path.join(process.cwd(), "..", "cv-latex.txt"),
  ];

  let templateContent = "";
  for (const candidate of candidates) {
    try {
      templateContent = fs.readFileSync(candidate, "utf-8");
      break;
    } catch {
      // try next candidate
    }
  }

  if (!templateContent) {
    throw new Error(
      `Could not find cv-latex.txt. Tried paths: ${candidates.join(", ")}`
    );
  }

  // 4. Prepare substitution values
  const rawEmail =
    (personalInfo.email as string) || "abdeldjalildrissi@gmail.com";
  const rawPhone = (personalInfo.phone as string) || "+213 790750708";
  const rawName = (personalInfo.name as string) || "DRISSI Abdeldjalil";
  const rawRole =
    (personalInfo.role as string) || "Electromechanical Engineer";
  const rawAddress = (personalInfo.location as string) || "Algeria";
  const rawSummary = (personalInfo.tagline as string) || "";

  // 5. Inject data
  const compiledTex = templateContent
    .replaceAll("<<NAME>>", escapeLatex(rawName))
    .replaceAll("<<ROLE>>", escapeLatex(rawRole))
    .replaceAll("<<MOB>>", escapeLatex(rawPhone))
    // Email: raw (unescaped) — the template uses it in \href{mailto:...}{...}
    .replaceAll("<<MAIL>>", rawEmail)
    .replaceAll("<<ADDRESS>>", escapeLatex(rawAddress))
    .replaceAll("<<SUMMARY>>", escapeLatex(rawSummary))
    .replaceAll("<<SOFT_SKILLS>>", softSkills)
    .replaceAll("<<SOFTWARE_SKILLS>>", softwareSkills)
    .replaceAll("<<LANGUAGE_SKILLS>>", languageSkills)
    .replaceAll("<<HOBBIES_SECTION>>", hobbiesSection)
    .replaceAll("<<EXPERIENCES_LIST>>", experiencesLatex)
    .replaceAll("<<CERTIFICATES_SECTION>>", certificationsLatex)
    .replaceAll("<<EDUCATION_LIST>>", educationLatex);

  // 6. Compile via TexLive.net cloud LaTeX API
  let res: Response;
  try {
    const formData = new FormData();
    formData.append("filecontents[]", compiledTex);
    formData.append("filename[]", "document.tex");
    formData.append("engine", "pdflatex");
    formData.append("return", "pdf");

    res = await fetch("https://texlive.net/cgi-bin/latexcgi", {
      method: "POST",
      body: formData,
    });
  } catch (networkErr) {
    throw new Error(
      `Network error reaching texlive.net: ${(networkErr as Error).message}`
    );
  }

  const contentType = res.headers.get("content-type") ?? "";
  if (!res.ok || !contentType.includes("application/pdf")) {
    const errorText = await res.text();
    const snippet =
      errorText.length > 2000
        ? `${errorText.slice(0, 600)}\n\n[...truncated...]\n\n${errorText.slice(-1200)}`
        : errorText;
    throw new Error(`LaTeX compilation failed.\n\n${snippet}`);
  }

  return Buffer.from(await res.arrayBuffer());
}
