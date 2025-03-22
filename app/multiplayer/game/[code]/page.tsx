"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft, CheckCircle2, Clock, Trophy, AlertCircle, XCircle } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { getGame, submitAnswer, nextQuestion, handleTimeUp, leaveGame, type GameState } from "@/app/server/store"

export default function MultiplayerGame({ params }: { params: { code: string } }) {
  const [gameData, setGameData] = useState<GameState | null>(null)
  const [playerName, setPlayerName] = useState("")
  const [playerRole, setPlayerRole] = useState("")
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [answerSubmitted, setAnswerSubmitted] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(20)
  const [showResults, setShowResults] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPolling, setIsPolling] = useState(false)
  const [lastQuestionIndex, setLastQuestionIndex] = useState<number | null>(null)
  const [timeIsUp, setTimeIsUp] = useState(false)
  const [countdownSeconds, setCountdownSeconds] = useState(10)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [showCountdown, setShowCountdown] = useState(false)
  const timeUpHandled = useRef(false)
  const autoAdvanceTimer = useRef<NodeJS.Timeout | null>(null)
  const countdownStartTime = useRef<number | null>(null)
  const allPlayersAnsweredTimestamp = useRef<number | null>(null)
  const autoAdvanceInitiated = useRef(false)
  const router = useRouter()

  // Load player info
  useEffect(() => {
    const storedPlayerName = localStorage.getItem("player_name")
    const storedPlayerRole = localStorage.getItem("player_role")
    const storedGameCode = localStorage.getItem("game_code")

    if (!storedPlayerName || !storedPlayerRole || storedGameCode !== params.code) {
      router.push("/multiplayer")
      return
    }

    setPlayerName(storedPlayerName)
    setPlayerRole(storedPlayerRole)
    setIsPolling(true)
  }, [params.code, router])

  // Function to start the countdown and auto-advance
  const startCountdownAndAutoAdvance = () => {
    console.log("Starting countdown and auto-advance")

    // Prevent multiple initializations
    if (autoAdvanceInitiated.current) {
      console.log("Auto-advance already initiated, skipping")
      return
    }

    autoAdvanceInitiated.current = true
    setShowCountdown(true)
    setShowResults(true)

    // Set the timestamp when all players answered
    if (allPlayersAnsweredTimestamp.current === null) {
      allPlayersAnsweredTimestamp.current = Date.now()
    }

    // Set the countdown start time
    countdownStartTime.current = Date.now()

    // Initial countdown value
    const initialCountdown = 10
    setCountdownSeconds(initialCountdown)

    // Set the auto-advance timer
    console.log("Setting auto-advance timer for 10 seconds from now")
  }

  // Poll for game updates
  useEffect(() => {
    if (!isPolling || !playerName) return

    const fetchGameData = async () => {
      try {
        const data = await getGame(params.code)

        if (!data) {
          // Game no longer exists
          router.push("/multiplayer")
          return
        }

        // Check if the question has changed
        if (data.currentQuestion !== lastQuestionIndex) {
          console.log(`Question changed from ${lastQuestionIndex} to ${data.currentQuestion}`)

          // Reset all states for the new question
          setLastQuestionIndex(data.currentQuestion)
          setSelectedAnswer(null)
          setAnswerSubmitted(false)
          setShowResults(false)
          setTimeIsUp(false)
          timeUpHandled.current = false
          setCountdownSeconds(10)
          setIsTransitioning(false)
          setShowCountdown(false)
          allPlayersAnsweredTimestamp.current = null
          autoAdvanceInitiated.current = false
          countdownStartTime.current = null

          // Clear any existing auto-advance timer
          if (autoAdvanceTimer.current) {
            clearTimeout(autoAdvanceTimer.current)
            autoAdvanceTimer.current = null
          }
        }

        setGameData(data)

        // If game is completed, redirect to results
        if (data.status === "completed") {
          router.push(`/multiplayer/results/${params.code}`)
          return
        }

        // Update timer if question has changed
        if (data.questionStartTime && data.currentQuestion !== undefined) {
          const elapsed = Math.floor((Date.now() - data.questionStartTime) / 1000)
          const remaining = Math.max(0, 20 - elapsed)
          setTimeRemaining(remaining)

          // Check if time is up
          if (remaining === 0 && !timeIsUp) {
            setTimeIsUp(true)

            // If we're the host and haven't handled time up yet
            if (playerRole === "host" && !timeUpHandled.current && !showResults) {
              timeUpHandled.current = true
              handleTimeIsUp()
            }
          }
        }

        // Update countdown timer if it's active
        if (countdownStartTime.current && showCountdown) {
          const elapsed = Math.floor((Date.now() - countdownStartTime.current) / 1000)
          const remaining = Math.max(0, 10 - elapsed)
          setCountdownSeconds(remaining)

          // Log countdown updates
          console.log(`Countdown updated: ${remaining} seconds remaining`)
          if (remaining == 0) {
            handleNextQuestion()
          }
        }

        // Check if all players have answered
        if (data.playerAnswers && !showResults && !isTransitioning && !autoAdvanceInitiated.current) {
          const allAnswered = data.players.every((player) => {
            const answer = data.playerAnswers?.[player]
            // Consider both explicit answers (0-3) and no answer (-1) as "answered"
            return answer && answer.answer !== null && (answer.answer >= 0 || answer.answer === -1)
          })

          if (allAnswered) {
            console.log("All players have answered, showing results")
            setShowResults(true)

            // Start the countdown and auto-advance (only if not already started)
            if (!autoAdvanceInitiated.current) {
              console.log("Initiating auto-advance sequence")
              startCountdownAndAutoAdvance()
            }
          }
        }
      } catch (err) {
        console.error("Error fetching game data:", err)
      }
    }

    // Initial fetch
    fetchGameData()

    // Set up polling
    const interval = setInterval(fetchGameData, 1000)

    return () => {
      clearInterval(interval)
      // Clear auto-advance timer on cleanup
      if (autoAdvanceTimer.current) {
        clearTimeout(autoAdvanceTimer.current)
        autoAdvanceTimer.current = null
      }
    }
  }, [
    isPolling,
    params.code,
    playerName,
    playerRole,
    router,
    showResults,
    lastQuestionIndex,
    timeIsUp,
    isTransitioning,
    showCountdown,
  ])

  // Handle time up (host only)
  const handleTimeIsUp = async () => {
    if (!gameData || playerRole !== "host") return

    try {
      await handleTimeUp(params.code)
      setShowResults(true)

      // Start the countdown and auto-advance
      if (!autoAdvanceInitiated.current) {
        startCountdownAndAutoAdvance()
      }
    } catch (err) {
      console.error("Error handling time up:", err)
    }
  }

  // Handle answer selection
  const handleAnswerSelect = async (index: number) => {
    if (answerSubmitted || !gameData || timeIsUp) return

    setSelectedAnswer(index)
    setAnswerSubmitted(true)

    try {
      await submitAnswer(params.code, playerName, index)
    } catch (err) {
      console.error("Error submitting answer:", err)
      setError("Failed to submit answer. Please try again.")
      setAnswerSubmitted(false)
      setSelectedAnswer(null)
    }
  }

  // Move to next question (host only)
  const handleNextQuestion = async () => {
    if (!gameData || playerRole !== "host" || isTransitioning) return

    // Set transitioning state to prevent multiple calls
    setIsTransitioning(true)
    console.log("Transitioning to next question...")

    // Clear any existing auto-advance timer
    if (autoAdvanceTimer.current) {
      clearTimeout(autoAdvanceTimer.current)
      autoAdvanceTimer.current = null
    }

    // Reset the timestamp and auto-advance flag
    allPlayersAnsweredTimestamp.current = null
    autoAdvanceInitiated.current = false
    countdownStartTime.current = null
    setShowCountdown(false)

    try {
      console.log("Calling nextQuestion API")
      const result = await nextQuestion(params.code)

      if (result.success) {
        console.log("Next question API call successful")
        // The state will be reset when the polling detects the new question
        if (result.gameCompleted) {
          router.push(`/multiplayer/results/${params.code}`)
        }
      } else {
        setError(result.error || "Failed to move to next question")
        setIsTransitioning(false)
      }
    } catch (err) {
      console.error("Error moving to next question:", err)
      setError("Failed to move to next question. Please try again.")
      setIsTransitioning(false)
    }
  }

  // Handle leaving the game
  const handleLeaveGame = async () => {
    try {
      await leaveGame(params.code, playerName)

      // Clear localStorage
      localStorage.removeItem("player_role")
      localStorage.removeItem("player_name")
      localStorage.removeItem("game_code")

      router.push("/multiplayer")
    } catch (err) {
      console.error("Error leaving game:", err)
    }
  }

  // Cleanup timers when component unmounts
  useEffect(() => {
    return () => {
      console.log("Cleaning up timers on unmount")
      if (autoAdvanceTimer.current) {
        console.log("Clearing auto-advance timer")
        clearTimeout(autoAdvanceTimer.current)
        autoAdvanceTimer.current = null
      }
    }
  }, [])

  if (!gameData) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[rgb(255,136,0)] mx-auto mb-4"></div>
          <p className="text-xl">Loading game...</p>
        </div>
      </div>
    )
  }

  const currentQuestion =
    gameData.currentQuestion !== undefined && gameData.questions ? gameData.questions[gameData.currentQuestion] : null

  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[rgb(255,136,0)] mx-auto mb-4"></div>
          <p className="text-xl">Waiting for game to start...</p>
        </div>
      </div>
    )
  }

  // Get player answers for the current question
  const playerAnswers = gameData.playerAnswers || {}

  // Calculate how many players have answered (including those who didn't answer in time)
  const playersAnswered = Object.values(playerAnswers).filter(
    (data) => data.answer !== null && data.answer >= -1,
  ).length

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <header className="border-b border-zinc-800 p-4">
        <div className="container flex justify-between items-center">
          <Button variant="ghost" className="text-white hover:text-white" onClick={handleLeaveGame}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Leave Game
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
          {/* Timer and progress */}
          {!showResults && !showCountdown && (
            <div className="mb-6 space-y-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <Clock className={`mr-2 h-5 w-5 ${timeIsUp ? "text-red-500" : "text-[rgb(255,136,0)]"}`} />
                  <span className={`font-bold ${timeIsUp ? "text-red-500" : ""}`}>
                    {timeIsUp ? "Time's up!" : `${timeRemaining} seconds`}
                  </span>
                </div>
                <div>
                  Question {gameData.currentQuestion! + 1} of {gameData.questions.length}
                </div>
              </div>
              <Progress
                value={(timeRemaining / 20) * 100}
                className="h-2 bg-zinc-800"
                indicatorClassName={timeIsUp ? "bg-red-500" : "bg-[rgb(255,136,0)]"}
              />
            </div>
          )}

          {/* Countdown to next question (when showing results) */}
          {showCountdown && (
            <div className="mb-6 space-y-2 bg-zinc-900 p-4 rounded-lg border border-[rgb(255,136,0)]">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <Clock className="mr-2 h-5 w-5 text-[rgb(255,136,0)]" />
                  <span className="font-bold text-lg">Next question in {countdownSeconds} seconds</span>
                </div>
                <div>
                  Question {gameData.currentQuestion! + 1} of {gameData.questions.length}
                </div>
              </div>
              <Progress
                value={(countdownSeconds / 10) * 100}
                className="h-3 bg-zinc-800"
                indicatorClassName="bg-[rgb(255,136,0)]"
              />
            </div>
          )}

          {/* Players who have answered (only show when question is active) */}
          {!showResults && (
            <div className="mb-6 bg-zinc-950 p-3 rounded-lg border border-zinc-800">
              <div className="flex justify-between items-center">
                <span className="text-sm">Players answered:</span>
                <span className="text-sm font-bold">
                  {playersAnswered}/{gameData.players.length}
                </span>
              </div>
              <Progress
                value={(playersAnswered / gameData.players.length) * 100}
                className="h-2 mt-2 bg-zinc-800"
                indicatorClassName="bg-green-500"
              />
            </div>
          )}

          {/* Question and answers */}
          {!showResults ? (
            <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800 mb-6">
              <h2 className="text-2xl font-bold mb-6">{currentQuestion.question}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentQuestion.options.map((option, index) => {
                  let className = "flex items-center p-4 border rounded-lg transition-colors"

                  if (selectedAnswer === index) {
                    className += " bg-[rgb(255,136,0)] border-[rgb(255,136,0)] text-white"
                  } else if (answerSubmitted || timeIsUp) {
                    className += " bg-zinc-800 border-zinc-700 opacity-50"
                  } else {
                    className += " bg-zinc-800 border-zinc-700 hover:bg-zinc-700 cursor-pointer"
                  }

                  return (
                    <div
                      key={index}
                      className={className}
                      onClick={() => !answerSubmitted && !timeIsUp && handleAnswerSelect(index)}
                    >
                      <div className="w-8 h-8 rounded-full bg-zinc-950 flex items-center justify-center mr-3">
                        {String.fromCharCode(65 + index)}
                      </div>
                      <span>{option}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Question results */}
              <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800">
                <h2 className="text-2xl font-bold mb-6">{currentQuestion.question}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {currentQuestion.options.map((option, index) => {
                    let className = "flex items-center p-4 border rounded-lg"

                    if (index === currentQuestion.correctAnswer) {
                      className += " bg-green-600 border-green-500"
                    } else {
                      className += " bg-zinc-800 border-zinc-700"
                    }

                    // Count how many players selected this answer
                    const playerCount = Object.values(playerAnswers).filter((data) => data.answer === index).length
                    const noAnswerCount = Object.values(playerAnswers).filter((data) => data.answer === -1).length

                    return (
                      <div key={index} className={className}>
                        <div className="w-8 h-8 rounded-full bg-zinc-950 flex items-center justify-center mr-3">
                          {String.fromCharCode(65 + index)}
                        </div>
                        <span>{option}</span>
                        {index === currentQuestion.correctAnswer && (
                          <CheckCircle2 className="ml-auto h-5 w-5 text-white" />
                        )}
                        {playerCount > 0 && (
                          <div className="ml-auto bg-zinc-950 px-2 py-1 rounded-full text-xs">
                            {playerCount} {playerCount === 1 ? "player" : "players"}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>

                {/* Show how many players didn't answer */}
                {Object.values(playerAnswers).filter((data) => data.answer === -1).length > 0 && (
                  <div className="mt-4 text-sm text-white/70 flex items-center">
                    <XCircle className="h-4 w-4 mr-2 text-red-500" />
                    {Object.values(playerAnswers).filter((data) => data.answer === -1).length}
                    {Object.values(playerAnswers).filter((data) => data.answer === -1).length === 1
                      ? " player"
                      : " players"}{" "}
                    didn't answer in time
                  </div>
                )}
              </div>

              {/* Current standings */}
              <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800">
                <h3 className="text-xl font-bold mb-4 flex items-center">
                  <Trophy className="mr-2 h-5 w-5 text-[rgb(255,136,0)]" /> Current Standings
                </h3>
                <div className="space-y-3">
                  {Object.entries(gameData.scores)
                    .sort(([, scoreA], [, scoreB]) => scoreB - scoreA)
                    .map(([player, score], index) => {
                      // Find if this player answered correctly for the current question
                      const playerAnswer = gameData.playerAnswers?.[player]
                      const isCorrect = playerAnswer && playerAnswer.answer === currentQuestion.correctAnswer
                      const didNotAnswer = playerAnswer && playerAnswer.answer === -1

                      // Calculate time bonus if answered correctly
                      const timeBonus = isCorrect ? Math.floor(1000 * (1 - (playerAnswer.time || 20000) / 20000)) : 0
                      const pointsThisRound = isCorrect ? 1000 + timeBonus : 0

                      return (
                        <div
                          key={player}
                          className={`flex justify-between items-center p-3 rounded-lg border ${
                            index === 0
                              ? "bg-[rgba(255,136,0,0.2)] border-[rgb(255,136,0)]"
                              : "bg-zinc-950 border-zinc-800"
                          } ${player === playerName ? "ring-2 ring-white/30" : ""}`}
                        >
                          <div className="flex items-center">
                            <div className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center mr-3">
                              {index + 1}
                            </div>
                            <div className="flex flex-col">
                              <span>
                                {player} {player === playerName && "(You)"}
                              </span>
                              {showResults && (
                                <div className="text-sm">
                                  {isCorrect && (
                                    <div className="flex items-center">
                                      <CheckCircle2 className="h-3 w-3 mr-1 text-green-400" />
                                      <span className="text-green-400">
                                        Correct! +1000 points {timeBonus > 0 && `(+${timeBonus} time bonus)`}
                                      </span>
                                    </div>
                                  )}
                                  {didNotAnswer && (
                                    <div className="flex items-center">
                                      <XCircle className="h-3 w-3 mr-1 text-red-400" />
                                      <span className="text-red-400">No answer (0 points)</span>
                                    </div>
                                  )}
                                  {!isCorrect && !didNotAnswer && (
                                    <div className="flex items-center">
                                      <XCircle className="h-3 w-3 mr-1 text-red-400" />
                                      <span className="text-red-400">Wrong answer (0 points)</span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                          <span className="font-bold text-lg">{score} pts</span>
                        </div>
                      )
                    })}
                </div>
              </div>
            </div>
          )}

          {/* Time's up message */}
          {timeIsUp && !answerSubmitted && !showResults && (
            <Alert className="bg-red-900 border-red-800 mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>Time's up! You didn't answer in time.</AlertDescription>
            </Alert>
          )}

          {/* Host controls */}
          {playerRole === "host" && showResults && (
            <div className="flex justify-end mt-4">
              <Button
                className="bg-[rgb(255,136,0)] hover:bg-[rgb(230,120,0)] text-white font-bold"
                onClick={handleNextQuestion}
                disabled={isTransitioning}
              >
                {isTransitioning ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                    Loading...
                  </>
                ) : gameData.currentQuestion! < gameData.questions.length - 1 ? (
                  "Next Question"
                ) : (
                  "See Final Results"
                )}
              </Button>
            </div>
          )}

          {/* Player feedback */}
          {playerRole === "player" && answerSubmitted && !showResults && (
            <Alert className="bg-green-900 border-green-800">
              <AlertDescription>Answer submitted! Waiting for other players...</AlertDescription>
            </Alert>
          )}
        </div>
      </main>
    </div>
  )
}

