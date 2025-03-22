"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Users, Play, Plus, Trash2, BookOpen, Loader2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { createGame, joinGame, getGame, removePlayer, leaveGame, startGame } from "../server/store"

export default function MultiplayerLobby() {
  const [gameCode, setGameCode] = useState("")
  const [isHost, setIsHost] = useState(false)
  const [players, setPlayers] = useState<string[]>([])
  const [playerName, setPlayerName] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isCreatingGame, setIsCreatingGame] = useState(false)
  const [isJoiningGame, setIsJoiningGame] = useState(false)
  const [isPolling, setIsPolling] = useState(false)
  const [inputGameCode, setInputGameCode] = useState("")
  const [hasGeneratedQuestions, setHasGeneratedQuestions] = useState(false)
  const [isStartingGame, setIsStartingGame] = useState(false)
  const [generatingQuestions, setGeneratingQuestions] = useState(false)
  const router = useRouter()

  // Load player name from localStorage if available
  useEffect(() => {
    const storedName = localStorage.getItem("player_name")
    const storedGameCode = localStorage.getItem("game_code")
    const storedRole = localStorage.getItem("player_role")
    const storedQuestions = localStorage.getItem("quizQuestions")

    if (storedName) {
      setPlayerName(storedName)
    }

    if (storedGameCode && storedRole) {
      setGameCode(storedGameCode)
      setIsHost(storedRole === "host")
      startPolling(storedGameCode)
    }

    if (storedQuestions) {
      setHasGeneratedQuestions(true)
    }
  }, [])

  // Create a new game
  const handleCreateGame = async () => {
    if (!playerName.trim()) {
      setError("Please enter your name")
      return
    }

    setIsCreatingGame(true)
    setError(null)

    try {
      const { code } = await createGame(playerName)

      // Save player info to localStorage
      localStorage.setItem("player_role", "host")
      localStorage.setItem("player_name", playerName)
      localStorage.setItem("game_code", code)

      setGameCode(code)
      setIsHost(true)
      setPlayers([playerName])
      startPolling(code)
    } catch (err) {
      console.error("Error creating game:", err)
      setError("Failed to create game. Please try again.")
    } finally {
      setIsCreatingGame(false)
    }
  }

  // Join an existing game
  const handleJoinGame = async () => {
    if (!playerName.trim()) {
      setError("Please enter your name")
      return
    }

    if (!inputGameCode.trim()) {
      setError("Please enter a game code")
      return
    }

    setIsJoiningGame(true)
    setError(null)

    try {
      // First check if the game exists without joining
      const gameData = await getGame(inputGameCode)

      if (!gameData) {
        setError("Game not found")
        setIsJoiningGame(false)
        return
      }

      // Check if game is already playing
      if (gameData.status === "playing") {
        setError("Game already in progress")
        setIsJoiningGame(false)
        return
      }

      // Now attempt to join the game
      const result = await joinGame(inputGameCode, playerName)

      if (!result.success) {
        setError(result.error || "Failed to join game")
        setIsJoiningGame(false)
        return
      }

      // Set the game code only after successfully joining
      setGameCode(inputGameCode)

      // Save player info to localStorage
      localStorage.setItem("player_role", "player")
      localStorage.setItem("player_name", playerName)
      localStorage.setItem("game_code", inputGameCode)

      // Get updated game state after joining
      const updatedGameData = await getGame(inputGameCode)
      if (updatedGameData) {
        setPlayers(updatedGameData.players)
      }

      // Start polling for updates only after successfully joining
      startPolling(inputGameCode)
    } catch (err) {
      console.error("Error joining game:", err)
      setError("Failed to join game. Please try again.")
    } finally {
      setIsJoiningGame(false)
    }
  }

  // Start polling for game updates
  const startPolling = (code: string) => {
    setIsPolling(true)
  }

  // Poll for updates only after successfully joining a game
  useEffect(() => {
    if (!isPolling || !gameCode) return

    const interval = setInterval(async () => {
      try {
        const gameData = await getGame(gameCode)

        if (gameData) {
          setPlayers(gameData.players)

          // If game status changes to playing, redirect to game
          if (gameData.status === "playing") {
            router.push(`/multiplayer/game/${gameCode}`)
          }
        } else {
          // Game no longer exists
          setError("Game no longer exists")
          setIsPolling(false)
          clearInterval(interval)
        }
      } catch (err) {
        console.error("Error polling game:", err)
      }
    }, 2000)

    return () => clearInterval(interval)
  }, [isPolling, gameCode, router])

  // Remove a player (host only)
  const handleRemovePlayer = async (playerToRemove: string) => {
    if (!isHost || playerToRemove === players[0]) return

    try {
      const result = await removePlayer(gameCode, playerToRemove)

      if (!result.success) {
        setError(result.error || "Failed to remove player")
      }
    } catch (err) {
      console.error("Error removing player:", err)
      setError("Failed to remove player. Please try again.")
    }
  }

  // Leave the game
  const handleLeaveGame = async () => {
    if (!gameCode || !playerName) return

    try {
      await leaveGame(gameCode, playerName)

      // Clear localStorage
      localStorage.removeItem("player_role")
      localStorage.removeItem("player_name")
      localStorage.removeItem("game_code")

      // Reset state
      setGameCode("")
      setPlayers([])
      setIsHost(false)
      setIsPolling(false)
    } catch (err) {
      console.error("Error leaving game:", err)
    }
  }

  // Generate questions and start the game
  const handleGenerateAndStart = async () => {
    if (!isHost || players.length < 2) {
      setError("Need at least 2 players to start")
      return
    }

    setGeneratingQuestions(true)
    setError(null)

    try {
      const inputTextElement = document.querySelector("textarea") as HTMLTextAreaElement
      if (!inputTextElement || inputTextElement.value.trim().length < 10) {
        setError("Please provide at least 10 characters to generate questions.")
        setGeneratingQuestions(false)
        return
      }

      // Create form data with the text input
      const formData = new FormData()
      formData.append("inputText", inputTextElement.value)

      // Generate questions
      const result = await fetch("/api/generate-questions", {
        method: "POST",
        body: formData,
      }).then((res) => res.json())

      if (!result.success) {
        setError(result.error || "Failed to generate questions")
        setGeneratingQuestions(false)
        return
      }

      // Store questions in localStorage
      localStorage.setItem("quizQuestions", JSON.stringify(result.questions))

      // Now start the game
      setIsStartingGame(true)
      const startResult = await startGame(gameCode, result.questions)

      if (!startResult.success) {
        setError(startResult.error || "Failed to start game")
        setIsStartingGame(false)
        setGeneratingQuestions(false)
        return
      }

      // Game started successfully, redirection will happen via polling
    } catch (err) {
      console.error("Error generating questions or starting game:", err)
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setGeneratingQuestions(false)
      setIsStartingGame(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <header className="border-b border-zinc-800 p-4">
        <div className="container flex justify-between items-center">
          <Button variant="ghost" className="text-white hover:text-white" onClick={() => router.push("/")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
          </Button>
          <h1 className="text-2xl font-bold">
            <span className="text-[rgb(255,136,0)] text-3xl">E</span>ducation
            <span className="text-[rgb(255,136,0)] text-3xl">2</span>
            <span className="text-[rgb(255,136,0)] text-3xl">B</span>oyz
          </h1>
        </div>
      </header>

      <main className="flex-1 container py-8">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">Multiplayer Quiz</h2>

          {!gameCode ? (
            <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800 space-y-6">
              <div className="space-y-4">
                <h3 className="text-xl font-bold">Enter Your Name</h3>
                <Input
                  className="bg-zinc-950 border-zinc-800 text-white"
                  placeholder="Your name"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-zinc-950 p-4 rounded-lg border border-zinc-800 space-y-4">
                  <h3 className="text-lg font-bold">Create a Game</h3>
                  <p className="text-sm text-white/70">Host a new game and invite friends to join</p>
                  <Button
                    className="w-full bg-[rgb(255,136,0)] hover:bg-[rgb(230,120,0)] text-white"
                    onClick={handleCreateGame}
                    disabled={isCreatingGame}
                  >
                    {isCreatingGame ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                        Creating...
                      </>
                    ) : (
                      <>
                        <Plus className="mr-2 h-4 w-4" /> Create Game
                      </>
                    )}
                  </Button>
                </div>

                <div className="bg-zinc-950 p-4 rounded-lg border border-zinc-800 space-y-4">
                  <h3 className="text-lg font-bold">Join a Game</h3>
                  <Input
                    className="bg-zinc-900 border-zinc-800 text-white uppercase"
                    placeholder="Enter game code"
                    value={inputGameCode}
                    onChange={(e) => setInputGameCode(e.target.value.toUpperCase())}
                  />
                  <Button
                    className="w-full bg-[rgb(255,136,0)] hover:bg-[rgb(230,120,0)] text-white"
                    onClick={handleJoinGame}
                    disabled={isJoiningGame}
                  >
                    {isJoiningGame ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                        Joining...
                      </>
                    ) : (
                      "Join Game"
                    )}
                  </Button>
                </div>
              </div>

              {error && (
                <Alert className="bg-red-900 border-red-800">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </div>
          ) : (
            <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800 space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold">Game Lobby</h3>
                <div className="bg-zinc-950 px-4 py-2 rounded-lg border border-zinc-800">
                  <span className="text-sm text-white/70 mr-2">Game Code:</span>
                  <span className="font-mono font-bold">{gameCode}</span>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-bold flex items-center">
                  <Users className="mr-2 h-4 w-4" /> Players ({players.length}/4)
                </h4>
                <div className="space-y-2">
                  {players.map((player, index) => (
                    <div
                      key={player}
                      className="flex justify-between items-center p-3 bg-zinc-950 rounded-lg border border-zinc-800"
                    >
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-[rgb(255,136,0)] flex items-center justify-center mr-3">
                          {index + 1}
                        </div>
                        <span>
                          {player} {index === 0 && "(Host)"}
                        </span>
                      </div>
                      {isHost && index !== 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-400"
                          onClick={() => handleRemovePlayer(player)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {isHost && (
                <div className="space-y-4">
                  <h4 className="font-bold flex items-center">
                    <BookOpen className="mr-2 h-4 w-4" /> Quiz Questions
                  </h4>

                  <div className="bg-zinc-950 p-4 rounded-lg border border-zinc-800">
                    <div className="space-y-4">
                      <textarea
                        className="w-full h-64 p-4 bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-[rgb(255,136,0)]"
                        placeholder="Paste your research text, article, or study material here..."
                      />

                      <Button
                        className="w-full bg-[rgb(255,136,0)] hover:bg-[rgb(230,120,0)] text-white font-bold py-4"
                        disabled={generatingQuestions || isStartingGame || players.length < 2}
                        onClick={handleGenerateAndStart}
                      >
                        {generatingQuestions ? (
                          <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Generating Questions...
                          </>
                        ) : isStartingGame ? (
                          <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Starting Game...
                          </>
                        ) : (
                          <>
                            <Play className="mr-2 h-5 w-5" />
                            Generate Questions and Start Game
                          </>
                        )}
                      </Button>

                      <p className="text-xs text-white/60 text-center">
                        The app will generate 10 questions based on your text and start the game immediately
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <Alert className="bg-red-900 border-red-800">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex justify-between">
                <Button variant="outline" className="text-white border-white" onClick={handleLeaveGame}>
                  Leave Game
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

