"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Home, Trophy, Medal } from "lucide-react"
import { getGame, leaveGame } from "@/app/server/store"

export default function ResultsPage({ params }: { params: { code: string } }) {
  const [gameData, setGameData] = useState<any>(null)
  const [playerName, setPlayerName] = useState("")
  const router = useRouter()

  // Load game data and player info
  useEffect(() => {
    const storedPlayerName = localStorage.getItem("player_name")
    const storedGameCode = localStorage.getItem("game_code")

    if (!storedPlayerName || storedGameCode !== params.code) {
      router.push("/multiplayer")
      return
    }

    setPlayerName(storedPlayerName)

    // Load game data
    const fetchGameData = async () => {
      try {
        const data = await getGame(params.code)
        if (data) {
          setGameData(data)
        } else {
          router.push("/multiplayer")
        }
      } catch (err) {
        console.error("Error fetching game data:", err)
        router.push("/multiplayer")
      }
    }

    fetchGameData()
  }, [params.code, router])

  const handlePlayAgain = async () => {
    try {
      // Leave the current game
      await leaveGame(params.code, playerName)

      // Clear localStorage
      localStorage.removeItem("player_role")
      localStorage.removeItem("player_name")
      localStorage.removeItem("game_code")

      // Redirect to multiplayer lobby
      router.push("/multiplayer")
    } catch (err) {
      console.error("Error leaving game:", err)
    }
  }

  if (!gameData) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[rgb(255,136,0)] mx-auto mb-4"></div>
          <p className="text-xl">Loading results...</p>
        </div>
      </div>
    )
  }

  // Sort players by score
  const sortedPlayers = Object.entries(gameData.scores)
    .sort(([, scoreA], [, scoreB]) => (scoreB as number) - (scoreA as number))
    .map(([player, score]) => ({ name: player, score }))

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <header className="border-b border-zinc-800 p-4">
        <div className="container flex justify-between items-center">
          <Button variant="ghost" className="text-white hover:text-white" onClick={() => router.push("/")}>
            <Home className="mr-2 h-4 w-4" /> Home
          </Button>
          <h1 className="text-2xl font-bold">
            <span className="text-[rgb(255,136,0)] text-3xl">E</span>ducation
            <span className="text-[rgb(255,136,0)] text-3xl">2</span>
            <span className="text-[rgb(255,136,0)] text-3xl">B</span>oyz
          </h1>
        </div>
      </header>

      <main className="flex-1 container py-8">
        <div className="max-w-2xl mx-auto text-center">
          <div className="mb-12">
            <Trophy className="h-16 w-16 text-[rgb(255,136,0)] mx-auto mb-4" />
            <h2 className="text-3xl font-bold">Game Results</h2>
          </div>

          <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800 mb-8">
            {/* Podium for top 3 */}
            {sortedPlayers.length >= 2 && (
              <div className="flex justify-center items-end mb-8 space-x-4">
                {/* Second place */}
                {sortedPlayers.length >= 2 && (
                  <div className="flex flex-col items-center">
                    <div className="text-lg font-bold">{sortedPlayers[1].name}</div>
                    <div className="text-sm text-white/70">{sortedPlayers[1].score} pts</div>
                    <div className="relative h-12 flex items-center justify-center">
                      <Medal className="h-8 w-8 text-gray-300" />
                    </div>
                    <div className="w-24 h-32 bg-zinc-800 rounded-t-lg flex items-center justify-center text-2xl">
                      2
                    </div>
                  </div>
                )}

                {/* First place */}
                <div className="flex flex-col items-center">
                  <div className="text-xl font-bold">{sortedPlayers[0].name}</div>
                  <div className="text-sm text-white/70">{sortedPlayers[0].score} pts</div>
                  <div className="relative h-12 flex items-center justify-center">
                    <Medal className="h-10 w-10 text-[rgb(255,136,0)]" />
                  </div>
                  <div className="w-28 h-40 bg-[rgba(255,136,0,0.2)] border border-[rgb(255,136,0)] rounded-t-lg flex items-center justify-center text-3xl">
                    1
                  </div>
                </div>

                {/* Third place */}
                {sortedPlayers.length >= 3 && (
                  <div className="flex flex-col items-center">
                    <div className="text-lg font-bold">{sortedPlayers[2].name}</div>
                    <div className="text-sm text-white/70">{sortedPlayers[2].score} pts</div>
                    <div className="relative h-12 flex items-center justify-center">
                      <Medal className="h-8 w-8 text-amber-700" />
                    </div>
                    <div className="w-24 h-24 bg-zinc-800 rounded-t-lg flex items-center justify-center text-2xl">
                      3
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Full leaderboard */}
            <h3 className="text-xl font-bold mb-4">Final Standings</h3>
            <div className="space-y-3">
              {sortedPlayers.map((player, index) => (
                <div
                  key={player.name}
                  className={`flex justify-between items-center p-3 rounded-lg border ${
                    player.name === playerName
                      ? "bg-[rgba(255,136,0,0.2)] border-[rgb(255,136,0)]"
                      : "bg-zinc-950 border-zinc-800"
                  }`}
                >
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center mr-3">
                      {index + 1}
                    </div>
                    <span>
                      {player.name} {player.name === playerName && "(You)"}
                    </span>
                  </div>
                  <span className="font-bold">{player.score} pts</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-center space-x-4">
            <Button variant="outline" className="text-white border-white" onClick={() => router.push("/")}>
              <Home className="mr-2 h-4 w-4" /> Home
            </Button>
            <Button className="bg-[rgb(255,136,0)] hover:bg-[rgb(230,120,0)] text-white" onClick={handlePlayAgain}>
              Play Again
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}

