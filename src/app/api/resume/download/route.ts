import { NextRequest, NextResponse } from "next/server"
import { generateResumePDF } from "@/lib/latex-generator"

export async function GET(request: NextRequest) {
  try {
    const pdfBuffer = await generateResumePDF()
    
    return new NextResponse(pdfBuffer as any, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Resume_Drissi_Abdeldjalil.pdf"`,
      },
    })
  } catch (error: any) {
    console.error("Resume generation error:", error)
    return NextResponse.json(
      { error: "Failed to generate PDF resume", details: error.message }, 
      { status: 500 }
    )
  }
}
