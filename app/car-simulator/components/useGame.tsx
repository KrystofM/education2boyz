"use client"

import { useContext } from "react"
import { GameContext } from "./game-context"

export function useGame() {
  return useContext(GameContext)
} 