"use client"

import { getSupabaseClient } from "./supabase-client"
import type { Question } from "../server/store"

// Types
export interface GameData {
  code: string
  host: string
  status: "waiting" | "playing" | "completed"
  questions: Question[]
  current_question?: number
  question_start_time?: number
  question_end_time?: number
  last_updated: number
}

export interface PlayerData {
  id?: number
  game_code: string
  name: string
  score: number
}

export interface PlayerAnswerData {
  id?: number
  game_code: string
  player_name: string
  question_index: number
  answer: number | null
  time_taken: number | null
}

// Game CRUD operations
export const getGame = async (code: string): Promise<GameData | null> => {
  const supabase = getSupabaseClient()

  const { data, error } = await supabase.from("games").select("*").eq("code", code).single()

  if (error || !data) return null
  return data as GameData
}

export const getGames = async (): Promise<GameData[]> => {
  const supabase = getSupabaseClient()

  const { data, error } = await supabase.from("games").select("*").order("last_updated", { ascending: false })

  if (error || !data) return []
  return data as GameData[]
}

export const updateGame = async (code: string, updates: Partial<GameData>): Promise<boolean> => {
  const supabase = getSupabaseClient()

  const { error } = await supabase
    .from("games")
    .update({ ...updates, last_updated: Date.now() })
    .eq("code", code)

  return !error
}

export const deleteGame = async (code: string): Promise<boolean> => {
  const supabase = getSupabaseClient()

  const { error } = await supabase.from("games").delete().eq("code", code)

  return !error
}

// Player CRUD operations
export const getPlayers = async (gameCode: string): Promise<PlayerData[]> => {
  const supabase = getSupabaseClient()

  const { data, error } = await supabase.from("players").select("*").eq("game_code", gameCode)

  if (error || !data) return []
  return data as PlayerData[]
}

export const getPlayer = async (gameCode: string, playerName: string): Promise<PlayerData | null> => {
  const supabase = getSupabaseClient()

  const { data, error } = await supabase
    .from("players")
    .select("*")
    .eq("game_code", gameCode)
    .eq("name", playerName)
    .single()

  if (error || !data) return null
  return data as PlayerData
}

export const updatePlayer = async (
  gameCode: string,
  playerName: string,
  updates: Partial<PlayerData>,
): Promise<boolean> => {
  const supabase = getSupabaseClient()

  const { error } = await supabase.from("players").update(updates).eq("game_code", gameCode).eq("name", playerName)

  return !error
}

export const deletePlayer = async (gameCode: string, playerName: string): Promise<boolean> => {
  const supabase = getSupabaseClient()

  const { error } = await supabase.from("players").delete().eq("game_code", gameCode).eq("name", playerName)

  return !error
}

// Player Answers CRUD operations
export const getPlayerAnswers = async (gameCode: string, questionIndex: number): Promise<PlayerAnswerData[]> => {
  const supabase = getSupabaseClient()

  const { data, error } = await supabase
    .from("player_answers")
    .select("*")
    .eq("game_code", gameCode)
    .eq("question_index", questionIndex)

  if (error || !data) return []
  return data as PlayerAnswerData[]
}

export const getPlayerAnswer = async (
  gameCode: string,
  playerName: string,
  questionIndex: number,
): Promise<PlayerAnswerData | null> => {
  const supabase = getSupabaseClient()

  const { data, error } = await supabase
    .from("player_answers")
    .select("*")
    .eq("game_code", gameCode)
    .eq("player_name", playerName)
    .eq("question_index", questionIndex)
    .single()

  if (error || !data) return null
  return data as PlayerAnswerData
}

export const updatePlayerAnswer = async (
  gameCode: string,
  playerName: string,
  questionIndex: number,
  updates: Partial<PlayerAnswerData>,
): Promise<boolean> => {
  const supabase = getSupabaseClient()

  const { error } = await supabase
    .from("player_answers")
    .update(updates)
    .eq("game_code", gameCode)
    .eq("player_name", playerName)
    .eq("question_index", questionIndex)

  return !error
}

// Question storage
export const saveQuestions = async (questions: Question[]): Promise<string> => {
  const supabase = getSupabaseClient()

  // Generate a unique ID for this question set
  const id = `qs_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`

  const { error } = await supabase.from("question_sets").insert({
    id,
    questions,
    created_at: new Date().toISOString(),
  })

  if (error) {
    console.error("Error saving questions:", error)
    throw new Error("Failed to save questions")
  }

  return id
}

export const getQuestionSet = async (id: string): Promise<Question[] | null> => {
  const supabase = getSupabaseClient()

  const { data, error } = await supabase.from("question_sets").select("questions").eq("id", id).single()

  if (error || !data) return null
  return data.questions
}

export const getRecentQuestionSets = async (
  limit = 10,
): Promise<{ id: string; questions: Question[]; created_at: string }[]> => {
  const supabase = getSupabaseClient()

  const { data, error } = await supabase
    .from("question_sets")
    .select("id, questions, created_at")
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error || !data) return []
  return data
}

