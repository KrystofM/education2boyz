import { NextResponse } from "next/server"
import { generateQuestions } from "@/app/actions"

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const result = await generateQuestions(formData)

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error generating questions:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to generate questions",
      },
      { status: 500 },
    )
  }
}

