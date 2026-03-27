import fs from "fs";
import path from "path";
import { db } from "@/db";
import { experiences, educations, skills, siteSettings } from "@/db/schema";
import { asc, desc, eq } from "drizzle-orm";

/**
 * Escapes special LaTeX characters for use in TEXT content only.
 * DO NOT use this for URLs (mailto:, href arguments) or raw LaTeX commands.
 *
 * Uses a two-pass approach:
 *  Pass 1: Replace characters with safe placeholders (no LaTeX chars)
 *  Pass 2: Replace placeholders with correct LaTeX sequences
 */
function escapeLatex(text: string): string {
  if (!text) return "";

  // Map of character → LaTeX command (using unique placeholders first)
  const replacements: [RegExp, string, string][] = [
    [/\\/g, "BKSL_PLACEHOLDER", "\\textbackslash{}"],
    [/\{/g, "LBRACE_PLACEHOLDER", "\\{"],
    [/\}/g, "RBRACE_PLACEHOLDER", "\\}"],
    [/&/g, "AMP_PLACEHOLDER", "\\&"],
    [/\$/g, "DOLLAR_PLACEHOLDER", "\\$"],
    [/%/g, "PERCENT_PLACEHOLDER", "\\%"],
    [/#/g, "HASH_PLACEHOLDER", "\\#"],
    [/_/g, "UNDER_PLACEHOLDER", "\\_"],
    [/~/g, "TILDE_PLACEHOLDER", "\\textasciitilde{}"],
    [/\^/g, "CARET_PLACEHOLDER", "\\textasciicircum{}"],
    [/\|/g, "PIPE_PLACEHOLDER", "\\textbar{}"],
    [/</g, "LT_PLACEHOLDER", "\\textless{}"],
    [/>/g, "GT_PLACEHOLDER", "\\textgreater{}"],
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
    const role = escapeLatex(exp.role);
    const company = escapeLatex(exp.company);
    const period = escapeLatex(exp.period).replace(/–/g, "--");
    const location = exp.location ? escapeLatex(exp.location) : "";

    const titleLine = `\\textbf{${role} \\textbar{} ${company} (${period}) ${location}}\n`;
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
    educationLatex += `\\item \\textbf{${degree}} (${period}) \\textbar{} ${school}\n`;
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

  // 3. Read template — try multiple candidate paths for robustness across envs
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
  // IMPORTANT: Email is used inside \href{mailto:email}{email}.
  // LaTeX href URL arguments must NOT have characters like _ escaped to \_.
  // We use the RAW email value here, not escaped through escapeLatex().
  const rawEmail =
    (personalInfo.email as string) || "abdeldjalildrissi@gmail.com";
  const rawPhone = (personalInfo.phone as string) || "+213 790750708";
  const rawName = (personalInfo.name as string) || "DRISSI Abdeldjalil";
  const rawRole =
    (personalInfo.role as string) || "Electromechanical Engineer";
  const rawAddress = (personalInfo.location as string) || "Algeria";
  const rawSummary = (personalInfo.tagline as string) || "";

  // 5. Inject data — replaceAll ensures EVERY occurrence is replaced
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
    .replaceAll("<<EXPERIENCES_LIST>>", experiencesLatex)
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
    // Show start + end of TeX log for maximum debug signal
    const snippet =
      errorText.length > 2000
        ? `${errorText.slice(0, 600)}\n\n[...truncated...]\n\n${errorText.slice(-1200)}`
        : errorText;
    throw new Error(`LaTeX compilation failed.\n\n${snippet}`);
  }

  return Buffer.from(await res.arrayBuffer());
}
