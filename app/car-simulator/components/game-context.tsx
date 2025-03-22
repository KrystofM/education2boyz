"use client"

import { createContext, useContext, ReactNode } from "react"

interface GameContextType {
  gameState: string;
  endGame: (position: number) => void;
}

export const GameContext = createContext<GameContextType>({
  gameState: "start",
  endGame: (position: number) => {},
})

interface GameProviderProps {
  children: ReactNode;
  value: GameContextType;
}

export const GameProvider = ({ children, value }: GameProviderProps) => {
  return <GameContext.Provider value={value}>{children}</GameContext.Provider>
}

export function useGame() {
  return useContext(GameContext)
}

