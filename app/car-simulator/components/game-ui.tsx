"use client"

import { useEffect, useRef, useState } from "react"
import { useGame } from "./game-context"

interface GameUIProps {
  gameState: string;
  startGame: () => void;
}

export default function GameUI({ gameState, startGame }: GameUIProps) {
  const [clientReady, setClientReady] = useState(false)

  // Ensure we only attach event listeners on the client
  useEffect(() => {
    setClientReady(true)
  }, [])

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Start screen */}
      {gameState === "start" && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/90 pointer-events-auto">
          <div className="bg-black/80 p-8 rounded-lg shadow-lg text-center border border-gray-700">
            <h1 className="text-3xl font-bold mb-4 text-white">Racing Quiz</h1>
            <p className="mb-6 text-gray-300">Race against bots and answer questions!</p>
            <button
              onClick={startGame}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors"
            >
              Start Race
            </button>
          </div>
        </div>
      )}

      {/* In-game UI */}
      {gameState === "playing" && (
        <div className="absolute bottom-0 left-0 right-0 p-4 flex justify-between items-center">
          {/* Instructions */}
          <div className="bg-black/50 p-2 rounded-lg text-white text-sm">
            <div>WASD or Arrow Keys to drive</div>
            <div>Answer questions correctly to earn points!</div>
          </div>
        </div>
      )}
    </div>
  )
}

