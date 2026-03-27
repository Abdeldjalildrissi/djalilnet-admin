import { NextRequest, NextResponse } from "next/server"
import { generateResumePDF } from "@/lib/latex-generator"

export async function GET(_request: NextRequest) {
  try {
    const pdfBuffer = await generateResumePDF()
    
    return new NextResponse(pdfBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Resume_Drissi_Abdeldjalil.pdf"`,
      },
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error"
    console.error("Resume generation error:", error)
    return NextResponse.json(
      { error: "Failed to generate PDF resume", details: message }, 
      { status: 500 }
    )
  }
}
