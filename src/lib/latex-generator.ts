import fs from "fs"
import path from "path"
import { spawnSync } from "child_process"
import { db } from "@/db"
import { experiences } from "@/db/schema"
import { asc, desc } from "drizzle-orm"

/**
 * Escapes special LaTeX characters in strings
 */
function escapeLatex(text: string): string {
  if (!text) return ""
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
}

export async function generateResumePDF(): Promise<Buffer> {
  // 1. Fetch DB Data
  const exps = await db.query.experiences.findMany({
    orderBy: [asc(experiences.order), desc(experiences.createdAt)]
  })

  // 2. Generate LaTeX string blocks
  let experiencesLatex = ""
  for (const exp of exps) {
    const titleLine = `\\textbf{${escapeLatex(exp.role)} | ${escapeLatex(exp.company)} (${escapeLatex(exp.period)}) ${exp.location ? escapeLatex(exp.location) : ""}}\n`
    
    let bulletsLatex = "\\begin{itemize}[label=$\\bullet$]\n"
    if (Array.isArray(exp.bullets)) {
      exp.bullets.forEach((bullet: string) => {
        bulletsLatex += `    \\item ${escapeLatex(bullet)}\n`
      })
    }
    bulletsLatex += "\\end{itemize}\n\n"
    
    experiencesLatex += titleLine + bulletsLatex
  }

  // 3. Read template and inject blocks
  const templatePath = path.join(process.cwd(), "..", "cv-latex.txt") // Usually the root of workspace is dj/
  let templateContent = ""

  try {
    templateContent = fs.readFileSync(templatePath, "utf-8")
  } catch (e) {
    // Attempt relative to nextjs root if path fails
    try {
      templateContent = fs.readFileSync(path.join(process.cwd(), "cv-latex.txt"), "utf-8")
    } catch(err) {
      throw new Error(`Could not find cv-latex.txt template at path ${templatePath}. Ensure it is present.`)
    }
  }

  // Inject Data into placeholders
  const compiledTex = templateContent.replace("<<EXPERIENCES_LIST>>", experiencesLatex)

  // 4. Compile to PDF
  const isDev = process.env.NODE_ENV === "development"
  
  if (isDev) {
    // In dev on Mac, we probably don't have pdflatex. 
    // We will use a fallback API or rely on texlive.net payload
    try {
      console.log("Using latexonline.cc API for local PDF compilation...")
      const payload = new URLSearchParams()
      payload.append("text", compiledTex)
      payload.append("command", "pdflatex")
      
      const res = await fetch("https://latexonline.cc/compile", {
        method: "POST",
        body: payload,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        }
      })
      if (!res.ok) {
        throw new Error(`LaTeX Online compilation failed: ${await res.text()}`)
      }
      return Buffer.from(await res.arrayBuffer())
    } catch(e) {
        console.error("Local compile fallback failed", e);
        throw new Error("Local pdflatex API compile failed. Verify 'latexonline.cc' is reachable or deploy.")
    }
  } else {
    // In Production Docker: Write to temp file and run pdflatex natively.
    const tmpDir = "/tmp"
    const tmpTexFile = path.join(tmpDir, `cv_${Date.now()}.tex`)
    fs.writeFileSync(tmpTexFile, compiledTex)

    // Run pdflatex (run twice to resolve any references/geometry properly)
    spawnSync("pdflatex", ["-interaction=nonstopmode", "-output-directory", tmpDir, tmpTexFile], { encoding: "utf8" })
    
    const pdfFile = tmpTexFile.replace(".tex", ".pdf")
    if (!fs.existsSync(pdfFile)) {
      throw new Error("pdflatex compiled but no PDF was generated.")
    }
    const pdfBuffer = fs.readFileSync(pdfFile)
    
    // Cleanup Temp files
    try {
      spawnSync("rm", [tmpTexFile, pdfFile, tmpTexFile.replace(".tex", ".log"), tmpTexFile.replace(".tex", ".aux")])
    } catch(e) {}
    
    return pdfBuffer
  }
}
