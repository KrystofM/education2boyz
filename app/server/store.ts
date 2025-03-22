"use server"

import { createServerSupabaseClient } from "./supabase-server"

// Types
export interface Question {
  question: string
  options: string[]
  correctAnswer: number
}

export interface PlayerAnswer {
  answer: number | null
  time: number | null
}

export interface GameState {
  host: string
  players: string[]
  status: "waiting" | "playing" | "completed"
  questions: Question[]
  scores: Record<string, number>
  currentQuestion?: number
  questionStartTime?: number
  playerAnswers?: Record<string, PlayerAnswer>
  lastUpdated: number
}

// Helper to clean up old games (run this periodically)
export async function cleanupOldGames() {
  const supabase = createServerSupabaseClient()
  const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000 // 2 hours in milliseconds

  await supabase.from("games").delete().lt("last_updated", twoHoursAgo)
}

// Generate a unique game code
export async function generateGameCode(): Promise<string> {
  const supabase = createServerSupabaseClient()
  let code: string
  let exists = true

  // Keep generating codes until we find an unused one
  while (exists) {
    code = Math.random().toString(36).substring(2, 8).toUpperCase()

    const { data } = await supabase.from("games").select("code").eq("code", code).single()

    exists = !!data
  }

  return code!
}

// Create a new game
export async function createGame(hostName: string): Promise<{ code: string }> {
  const supabase = createServerSupabaseClient()
  const code = await generateGameCode()
  const now = Date.now()

  // Insert game record
  await supabase.from("games").insert({
    code,
    host: hostName,
    status: "waiting",
    questions: [],
    last_updated: now,
  })

  // Insert host as first player
  await supabase.from("players").insert({
    game_code: code,
    name: hostName,
    score: 0,
  })

  return { code }
}

// Get game state
export async function getGame(code: string): Promise<GameState | null> {
  const supabase = createServerSupabaseClient()

  // Get game data
  const { data: game } = await supabase.from("games").select("*").eq("code", code).single()

  if (!game) return null

  // Get players
  const { data: players } = await supabase.from("players").select("name, score").eq("game_code", code)

  if (!players) return null

  // Get player answers for current question if game is playing
  const playerAnswers: Record<string, PlayerAnswer> = {}

  if (game.status === "playing" && game.current_question !== null) {
    const { data: answers } = await supabase
      .from("player_answers")
      .select("player_name, answer, time_taken")
      .eq("game_code", code)
      .eq("question_index", game.current_question)

    if (answers) {
      answers.forEach((answer) => {
        playerAnswers[answer.player_name] = {
          answer: answer.answer,
          time: answer.time_taken,
        }
      })
    }

    // Ensure all players have an entry in playerAnswers
    players.forEach((player) => {
      if (!playerAnswers[player.name]) {
        playerAnswers[player.name] = {
          answer: null,
          time: null,
        }
      }
    })
  }

  // Build scores object
  const scores: Record<string, number> = {}
  players.forEach((player) => {
    scores[player.name] = player.score
  })

  // Build player list
  const playerNames = players.map((player) => player.name)

  // Ensure host is first in the list
  const hostIndex = playerNames.indexOf(game.host)
  if (hostIndex > 0) {
    playerNames.splice(hostIndex, 1)
    playerNames.unshift(game.host)
  }

  return {
    host: game.host,
    players: playerNames,
    status: game.status as "waiting" | "playing" | "completed",
    questions: game.questions || [],
    scores,
    currentQuestion: game.current_question,
    questionStartTime: game.question_start_time,
    playerAnswers: Object.keys(playerAnswers).length > 0 ? playerAnswers : undefined,
    lastUpdated: game.last_updated,
  }
}

// Check if a game exists and is joinable
export async function checkGame(code: string): Promise<{
  exists: boolean
  joinable: boolean
  error?: string
}> {
  const supabase = createServerSupabaseClient()

  // Get game data
  const { data: game } = await supabase.from("games").select("status").eq("code", code).single()

  if (!game) {
    return { exists: false, joinable: false, error: "Game not found" }
  }

  if (game.status !== "waiting") {
    return { exists: true, joinable: false, error: "Game already in progress" }
  }

  // Count players
  const { count } = await supabase.from("players").select("*", { count: "exact", head: true }).eq("game_code", code)

  if (count && count >= 4) {
    return { exists: true, joinable: false, error: "Game is full" }
  }

  return { exists: true, joinable: true }
}

// Join a game
export async function joinGame(code: string, playerName: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createServerSupabaseClient()

  // Check if game exists and is joinable
  const gameStatus = await checkGame(code)

  if (!gameStatus.exists) {
    return { success: false, error: "Game not found" }
  }

  if (!gameStatus.joinable) {
    return { success: false, error: gameStatus.error }
  }

  // Check if name is already taken
  const { data: existingPlayer } = await supabase
    .from("players")
    .select("name")
    .eq("game_code", code)
    .eq("name", playerName)
    .single()

  if (existingPlayer) {
    return { success: false, error: "Name already taken" }
  }

  // Add player
  await supabase.from("players").insert({
    game_code: code,
    name: playerName,
    score: 0,
  })

  // Update game's last_updated timestamp
  await supabase.from("games").update({ last_updated: Date.now() }).eq("code", code)

  return { success: true }
}

// Start a game
export async function startGame(code: string, questions: Question[]): Promise<{ success: boolean; error?: string }> {
  const supabase = createServerSupabaseClient()

  console.log(`Starting game ${code} with ${questions.length} questions`)

  try {
    // Get game data
    const { data: game, error: gameError } = await supabase.from("games").select("*").eq("code", code).single()

    if (gameError || !game) {
      console.error("Game not found:", gameError)
      return { success: false, error: "Game not found" }
    }

    // Count players
    const { count, error: countError } = await supabase
      .from("players")
      .select("*", { count: "exact", head: true })
      .eq("game_code", code)

    if (countError) {
      console.error("Error counting players:", countError)
      return { success: false, error: "Failed to count players" }
    }

    if (!count || count < 2) {
      console.log("Not enough players")
      return { success: false, error: "Need at least 2 players to start" }
    }

    const now = Date.now()

    // Make sure questions array is valid
    if (!Array.isArray(questions) || questions.length === 0) {
      console.error("Invalid questions array:", questions)
      return { success: false, error: "Invalid questions data" }
    }

    // Ensure questions are properly formatted
    const sanitizedQuestions = questions.map((q) => ({
      question: String(q.question || ""),
      options: Array.isArray(q.options) ? q.options.map((o) => String(o || "")) : [],
      correctAnswer: Number(q.correctAnswer || 0),
    }))

    // Update game
    const { error: updateError } = await supabase
      .from("games")
      .update({
        status: "playing",
        questions: sanitizedQuestions,
        current_question: 0,
        question_start_time: now,
        last_updated: now,
      })
      .eq("code", code)

    if (updateError) {
      console.error("Error updating game:", updateError)
      return { success: false, error: `Failed to update game: ${updateError.message}` }
    }

    // Initialize player answers for first question
    const { data: players, error: playersError } = await supabase.from("players").select("name").eq("game_code", code)

    if (playersError) {
      console.error("Error fetching players:", playersError)
      return { success: false, error: "Failed to fetch players" }
    }

    if (players && players.length > 0) {
      console.log(`Initializing answers for ${players.length} players`)
      const playerAnswers = players.map((player) => ({
        game_code: code,
        player_name: player.name,
        question_index: 0,
        answer: null,
        time_taken: null,
      }))

      const { error: insertError } = await supabase.from("player_answers").insert(playerAnswers)

      if (insertError) {
        console.error("Error inserting player answers:", insertError)
        return { success: false, error: "Failed to initialize player answers" }
      }
    }

    console.log("Game started successfully")
    return { success: true }
  } catch (err) {
    console.error("Unexpected error starting game:", err)
    return { success: false, error: "An unexpected error occurred" }
  }
}

// Submit an answer
export async function submitAnswer(
  code: string,
  playerName: string,
  answer: number,
): Promise<{ success: boolean; error?: string }> {
  const supabase = createServerSupabaseClient()

  // Get game data
  const { data: game } = await supabase
    .from("games")
    .select("status, current_question, question_start_time")
    .eq("code", code)
    .single()

  if (!game || game.status !== "playing" || game.current_question === null) {
    return { success: false, error: "Game not active" }
  }

  // Calculate time taken
  const timeTaken = game.question_start_time ? Math.min(20000, Date.now() - game.question_start_time) : 20000

  // Check if player answer exists
  const { data: existingAnswer } = await supabase
    .from("player_answers")
    .select("*")
    .eq("game_code", code)
    .eq("player_name", playerName)
    .eq("question_index", game.current_question)
    .single()

  if (existingAnswer) {
    // Update existing answer
    const { error } = await supabase
      .from("player_answers")
      .update({
        answer,
        time_taken: timeTaken,
      })
      .eq("game_code", code)
      .eq("player_name", playerName)
      .eq("question_index", game.current_question)

    if (error) {
      console.error("Error updating player answer:", error)
      return { success: false, error: "Failed to submit answer" }
    }
  } else {
    // Insert new answer
    const { data: player } = await supabase.from("players").select("name").eq("name", playerName).single()

    if (!player) {
      return { success: false, error: "Player not found" }
    }

    const { error } = await supabase.from("player_answers").insert({
      game_code: code,
      player_name: player.name,
      question_index: game.current_question,
      answer,
      time_taken: timeTaken,
    })

    if (error) {
      console.error("Error inserting player answer:", error)
      return { success: false, error: "Failed to submit answer" }
    }
  }

  // Update game's last_updated timestamp
  await supabase.from("games").update({ last_updated: Date.now() }).eq("code", code)

  return { success: true }
}

// Move to next question
export async function nextQuestion(
  code: string,
): Promise<{ success: boolean; error?: string; gameCompleted?: boolean }> {
  const supabase = createServerSupabaseClient()

  console.log(`Moving to next question for game ${code}`)

  // Get game data
  const { data: game } = await supabase.from("games").select("*").eq("code", code).single()

  if (!game || game.status !== "playing" || game.current_question === null) {
    console.log("Game not active or current_question is null")
    return { success: false, error: "Game not active" }
  }

  // Get current question
  const currentQuestion = game.questions[game.current_question]
  if (!currentQuestion) {
    console.log("Current question not found")
    return { success: false, error: "Current question not found" }
  }

  // Get player answers
  const { data: playerAnswers } = await supabase
    .from("player_answers")
    .select("player_name, answer, time_taken")
    .eq("game_code", code)
    .eq("question_index", game.current_question)

  if (playerAnswers) {
    console.log(`Processing ${playerAnswers.length} player answers`)
    // Update scores for each player
    for (const answer of playerAnswers) {
      if (answer.answer === currentQuestion.correctAnswer) {
        // Calculate time bonus (up to 1000 additional points)
        const timeBonus = Math.floor(1000 * (1 - (answer.time_taken || 20000) / 20000))
        const pointsToAdd = 1000 + timeBonus

        console.log(`Player ${answer.player_name} answered correctly, adding ${pointsToAdd} points`)

        // Get current score
        const { data: player } = await supabase
          .from("players")
          .select("score")
          .eq("game_code", code)
          .eq("name", answer.player_name)
          .single()

        if (player) {
          // Update player score
          await supabase
            .from("players")
            .update({
              score: player.score + pointsToAdd,
            })
            .eq("game_code", code)
            .eq("name", answer.player_name)
        }
      }
    }
  }

  // Check if this was the last question
  if (game.current_question < game.questions.length - 1) {
    // Move to next question
    const nextQuestionIndex = game.current_question + 1
    const now = Date.now()

    console.log(`Moving to question ${nextQuestionIndex}`)

    // Update game
    const { error } = await supabase
      .from("games")
      .update({
        current_question: nextQuestionIndex,
        question_start_time: now,
        last_updated: now,
      })
      .eq("code", code)

    if (error) {
      console.error("Error updating game:", error)
      return { success: false, error: "Failed to update game" }
    }

    // Initialize player answers for next question
    const { data: players } = await supabase.from("players").select("name").eq("game_code", code)

    if (players) {
      console.log(`Initializing answers for ${players.length} players`)
      const newPlayerAnswers = players.map((player) => ({
        game_code: code,
        player_name: player.name,
        question_index: nextQuestionIndex,
        answer: null,
        time_taken: null,
      }))

      const { error: insertError } = await supabase.from("player_answers").insert(newPlayerAnswers)

      if (insertError) {
        console.error("Error inserting player answers:", insertError)
        return { success: false, error: "Failed to initialize player answers" }
      }
    }

    return { success: true }
  } else {
    // End game
    console.log("This was the last question, ending game")
    await supabase
      .from("games")
      .update({
        status: "completed",
        last_updated: Date.now(),
      })
      .eq("code", code)

    return { success: true, gameCompleted: true }
  }
}

// Handle time up for a question
export async function handleTimeUp(code: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createServerSupabaseClient()

  // Get game data
  const { data: game } = await supabase.from("games").select("status, current_question").eq("code", code).single()

  if (!game || game.status !== "playing" || game.current_question === null) {
    return { success: false, error: "Game not active" }
  }

  // Get all players
  const { data: players } = await supabase.from("players").select("name").eq("game_code", code)

  if (!players || players.length === 0) {
    return { success: false, error: "No players found" }
  }

  // Get players who have already answered
  const { data: answeredPlayers } = await supabase
    .from("player_answers")
    .select("player_name, answer")
    .eq("game_code", code)
    .eq("question_index", game.current_question)

  // Create a map of player answers
  const playerAnswerMap = new Map<string, number | null>()

  if (answeredPlayers) {
    answeredPlayers.forEach((player) => {
      playerAnswerMap.set(player.player_name, player.answer)
    })
  }

  // For each player who hasn't answered or has a null answer, set a default answer of -1
  for (const player of players) {
    const hasAnswered = playerAnswerMap.has(player.name) && playerAnswerMap.get(player.name) !== null

    if (!hasAnswered) {
      // Check if player answer record exists
      const { data: existingAnswer } = await supabase
        .from("player_answers")
        .select("*")
        .eq("game_code", code)
        .eq("player_name", player.name)
        .eq("question_index", game.current_question)
        .single()

      if (existingAnswer) {
        // Update existing answer
        await supabase
          .from("player_answers")
          .update({
            answer: -1, // -1 indicates no answer
            time_taken: 20000, // Max time
          })
          .eq("game_code", code)
          .eq("player_name", player.name)
          .eq("question_index", game.current_question)
      } else {
        // Insert new answer
        const { data: playerRecord } = await supabase
          .from("players")
          .select("name")
          .eq("name", player.name)
          .eq("game_code", code)
          .single()

        if (!playerRecord) {
          console.error("Player not found:", player.name)
          continue
        }

        await supabase.from("player_answers").insert({
          game_code: code,
          player_name: player.name,
          question_index: game.current_question,
          answer: -1,
          time_taken: 20000,
        })
      }
    }
  }

  // Update game's last_updated timestamp
  await supabase.from("games").update({ last_updated: Date.now() }).eq("code", code)

  return { success: true }
}

// Leave a game
export async function leaveGame(code: string, playerName: string): Promise<{ success: boolean }> {
  const supabase = createServerSupabaseClient()

  // Get game data
  const { data: game } = await supabase.from("games").select("host").eq("code", code).single()

  // If host leaves, end the game
  if (game && game.host === playerName) {
    // Delete the game (cascade will delete players and answers)
    await supabase.from("games").delete().eq("code", code)
  } else {
    // Remove player
    await supabase.from("players").delete().eq("game_code", code).eq("name", playerName)

    // Remove player answers
    await supabase.from("player_answers").delete().eq("game_code", code).eq("player_name", playerName)

    // Update game's last_updated timestamp
    await supabase.from("games").update({ last_updated: Date.now() }).eq("code", code)
  }

  return { success: true }
}

// Remove a player (host only)
export async function removePlayer(
  code: string,
  playerToRemove: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = createServerSupabaseClient()

  // Get game data
  const { data: game } = await supabase.from("games").select("host").eq("code", code).single()

  if (!game) {
    return { success: false, error: "Game not found" }
  }

  if (game.host === playerToRemove) {
    return { success: false, error: "Cannot remove host" }
  }

  // Remove player
  await supabase.from("players").delete().eq("game_code", code).eq("name", playerToRemove)

  // Remove player answers
  await supabase.from("player_answers").delete().eq("game_code", code).eq("player_name", playerToRemove)

  // Update game's last_updated timestamp
  await supabase.from("games").update({ last_updated: Date.now() }).eq("code", code)

  return { success: true }
}

