import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/app/server/supabase-server"

export async function GET() {
  try {
    const supabase = createServerSupabaseClient()

    // Check games table
    const { data: gamesInfo, error: gamesError } = await supabase.from("games").select("*").limit(1)

    if (gamesError) {
      return NextResponse.json({
        error: `Error accessing games table: ${gamesError.message}`,
        success: false,
      })
    }

    // Check players table
    const { data: playersInfo, error: playersError } = await supabase.from("players").select("*").limit(1)

    if (playersError) {
      return NextResponse.json({
        error: `Error accessing players table: ${playersError.message}`,
        success: false,
      })
    }

    // Check player_answers table
    const { data: answersInfo, error: answersError } = await supabase.from("player_answers").select("*").limit(1)

    if (answersError) {
      return NextResponse.json({
        error: `Error accessing player_answers table: ${answersError.message}`,
        success: false,
      })
    }

    return NextResponse.json({
      message: "Database connection successful",
      tables: {
        games: gamesInfo ? "accessible" : "empty",
        players: playersInfo ? "accessible" : "empty",
        player_answers: answersInfo ? "accessible" : "empty",
      },
      success: true,
    })
  } catch (error) {
    console.error("Database check error:", error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Unknown error",
      success: false,
    })
  }
}

