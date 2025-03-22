"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { PhoneCall, Users, Scissors, ArrowLeft, CheckCircle2, XCircle, AlertCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { Alert, AlertDescription } from "@/components/ui/alert"

// Define the question type
interface Question {
  question: string
  options: string[]
  correctAnswer: number
}

// Updated to have exactly 10 money levels
const moneyLevels = [
  "$500",
  "$1,000",
  "$2,000",
  "$5,000",
  "$10,000",
  "$25,000",
  "$50,000",
  "$100,000",
  "$500,000",
  "$1,000,000",
]

export default function GamePage() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [isAnswerChecked, setIsAnswerChecked] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [gameOver, setGameOver] = useState(false)
  const [fiftyFiftyUsed, setFiftyFiftyUsed] = useState(false)
  const [eliminatedOptions, setEliminatedOptions] = useState<number[]>([])
  const [audienceHelpUsed, setAudienceHelpUsed] = useState(false)
  const [phoneHelpUsed, setPhoneHelpUsed] = useState(false)
  const [showAudienceHelp, setShowAudienceHelp] = useState(false)
  const [showPhoneHelp, setShowPhoneHelp] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [usingFallback, setUsingFallback] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Load questions from localStorage
    try {
      const storedQuestions = localStorage.getItem("quizQuestions")
      if (storedQuestions) {
        const parsedQuestions = JSON.parse(storedQuestions)
        setQuestions(parsedQuestions)

        // If we have fewer than 10 questions, we're using fallback
        if (parsedQuestions.length < 10) {
          setUsingFallback(true)
        }
      } else {
        // If no questions found, redirect to home
        router.push("/")
      }
    } catch (error) {
      console.error("Error loading questions:", error)
      router.push("/")
    } finally {
      setIsLoading(false)
    }
  }, [router])

  const handleAnswerSelect = (index: number) => {
    if (isAnswerChecked || eliminatedOptions.includes(index)) return
    setSelectedAnswer(index)
  }

  const checkAnswer = () => {
    if (selectedAnswer === null || questions.length === 0) return

    setIsAnswerChecked(true)
    const correct = selectedAnswer === questions[currentQuestion].correctAnswer
    setIsCorrect(correct)

    if (!correct) {
      setTimeout(() => {
        setGameOver(true)
      }, 2000)
    } else {
      if (currentQuestion === 9) {
        // Now we have exactly 10 questions (0-9)
        setTimeout(() => {
          setGameOver(true)
        }, 2000)
      } else {
        setTimeout(() => {
          setCurrentQuestion(currentQuestion + 1)
          setSelectedAnswer(null)
          setIsAnswerChecked(false)
          setShowAudienceHelp(false)
          setShowPhoneHelp(false)
          // Reset eliminated options when moving to the next question
          setEliminatedOptions([])
        }, 2000)
      }
    }
  }

  const useFiftyFifty = () => {
    if (fiftyFiftyUsed || questions.length === 0) return

    const correctAnswer = questions[currentQuestion].correctAnswer
    let available = [0, 1, 2, 3].filter((i) => i !== correctAnswer)

    // Randomly remove two wrong answers
    available = available.sort(() => 0.5 - Math.random()).slice(0, 2)
    setEliminatedOptions(available)
    setFiftyFiftyUsed(true)
  }

  const useAudienceHelp = () => {
    if (audienceHelpUsed) return
    setAudienceHelpUsed(true)
    setShowAudienceHelp(true)
  }

  const usePhoneHelp = () => {
    if (phoneHelpUsed) return
    setPhoneHelpUsed(true)
    setShowPhoneHelp(true)
  }

  const getOptionClassName = (index: number) => {
    let className = "flex items-center p-4 border rounded-lg transition-colors"

    if (eliminatedOptions.includes(index)) {
      className += " opacity-20 cursor-not-allowed"
    } else if (isAnswerChecked) {
      if (index === questions[currentQuestion]?.correctAnswer) {
        className += " bg-green-600 border-green-500"
      } else if (index === selectedAnswer) {
        className += " bg-red-600 border-red-500"
      } else {
        className += " bg-blue-900 border-blue-700"
      }
    } else if (selectedAnswer === index) {
      className += " bg-[rgb(255,136,0)] border-[rgb(255,136,0)] text-white"
    } else {
      className += " bg-zinc-900 border-zinc-800 hover:bg-zinc-800"
    }

    return className
  }

  const handleExitGame = () => {
    // Clear the stored questions when exiting
    localStorage.removeItem("quizQuestions")
    router.push("/")
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[rgb(255,136,0)] mx-auto mb-4"></div>
          <p className="text-xl">Loading your quiz questions...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <header className="border-b border-zinc-800 p-4">
        <div className="container flex justify-between items-center">
          <Button variant="ghost" className="text-white hover:text-white" onClick={handleExitGame}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Exit Game
          </Button>
          <h1 className="text-2xl font-bold">
            <span className="text-[rgb(255,136,0)] text-3xl">E</span>ducation
            <span className="text-[rgb(255,136,0)] text-3xl">2</span>
            <span className="text-[rgb(255,136,0)] text-3xl">B</span>oyz
          </h1>
        </div>
      </header>

      <main className="flex-1 container py-8">
        {gameOver ? (
          <div className="max-w-2xl mx-auto text-center space-y-8 bg-zinc-900 p-8 rounded-xl border border-zinc-800">
            <h2 className="text-3xl font-bold">Game Over!</h2>
            <p className="text-xl">
              {isCorrect && currentQuestion === 9
                ? "Congratulations! You've won $1 MILLION!"
                : `You won: ${currentQuestion > 0 ? moneyLevels[currentQuestion - 1] : "$0"}`}
            </p>
            <Button
              className="bg-[rgb(255,136,0)] hover:bg-[rgb(230,120,0)] text-white font-bold"
              onClick={handleExitGame}
            >
              Play Again
            </Button>
          </div>
        ) : (
          <div className="grid md:grid-cols-4 gap-8">
            {usingFallback && (
              <div className="md:col-span-4 mb-2">
                <Alert className="bg-amber-900 border-amber-700">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Using demo questions. To generate custom questions based on your text, add your OpenAI API key.
                  </AlertDescription>
                </Alert>
              </div>
            )}

            <div className="md:col-span-3 space-y-8">
              <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800">
                <h2 className="text-2xl font-bold mb-6">
                  Question {currentQuestion + 1}: {moneyLevels[currentQuestion]}
                </h2>
                <p className="text-xl mb-8">{questions[currentQuestion]?.question}</p>

                {showAudienceHelp && (
                  <div className="mb-6 p-4 bg-zinc-950 rounded-lg border border-zinc-800">
                    <h3 className="font-bold mb-2">Audience Poll:</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {questions[currentQuestion]?.options.map((_, index) => {
                        const correctAnswer = questions[currentQuestion]?.correctAnswer
                        let percentage =
                          index === correctAnswer ? 60 + Math.floor(Math.random() * 30) : Math.floor(Math.random() * 30)

                        // Adjust percentages for eliminated options
                        if (eliminatedOptions.includes(index)) percentage = 0

                        // Normalize percentages to sum to 100%
                        return (
                          <div key={index} className="flex items-center gap-2">
                            <span className="text-sm">{String.fromCharCode(65 + index)}:</span>
                            <div className="h-4 bg-zinc-800 rounded-full flex-1">
                              <div
                                className="h-4 bg-[rgb(255,136,0)] rounded-full"
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                            <span className="text-sm">{percentage}%</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {showPhoneHelp && (
                  <div className="mb-6 p-4 bg-zinc-950 rounded-lg border border-zinc-800">
                    <h3 className="font-bold mb-2">Friend says:</h3>
                    <p>
                      "I'm pretty sure the answer is{" "}
                      {String.fromCharCode(65 + questions[currentQuestion]?.correctAnswer)}, but you might want to
                      double-check that."
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {questions[currentQuestion]?.options.map((option, index) => (
                    <div key={index} className={getOptionClassName(index)} onClick={() => handleAnswerSelect(index)}>
                      <div className="w-8 h-8 rounded-full bg-zinc-950 flex items-center justify-center mr-3">
                        {String.fromCharCode(65 + index)}
                      </div>
                      <span>{option}</span>
                      {isAnswerChecked && index === questions[currentQuestion]?.correctAnswer && (
                        <CheckCircle2 className="ml-auto h-5 w-5 text-white" />
                      )}
                      {isAnswerChecked &&
                        index === selectedAnswer &&
                        index !== questions[currentQuestion]?.correctAnswer && (
                          <XCircle className="ml-auto h-5 w-5 text-white" />
                        )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={useFiftyFifty}
                    disabled={fiftyFiftyUsed || isAnswerChecked}
                    className={
                      fiftyFiftyUsed
                        ? "opacity-50 cursor-not-allowed text-white border-white"
                        : "text-white border-white"
                    }
                  >
                    <Scissors className="mr-2 h-4 w-4" /> 50:50
                  </Button>
                  <Button
                    variant="outline"
                    onClick={useAudienceHelp}
                    disabled={audienceHelpUsed || isAnswerChecked}
                    className={
                      audienceHelpUsed
                        ? "opacity-50 cursor-not-allowed text-white border-white"
                        : "text-white border-white"
                    }
                  >
                    <Users className="mr-2 h-4 w-4" /> Audience
                  </Button>
                  <Button
                    variant="outline"
                    onClick={usePhoneHelp}
                    disabled={phoneHelpUsed || isAnswerChecked}
                    className={
                      phoneHelpUsed
                        ? "opacity-50 cursor-not-allowed text-white border-white"
                        : "text-white border-white"
                    }
                  >
                    <PhoneCall className="mr-2 h-4 w-4" /> Phone
                  </Button>
                </div>

                <Button
                  className="bg-[rgb(255,136,0)] hover:bg-[rgb(230,120,0)] text-white font-bold"
                  onClick={checkAnswer}
                  disabled={selectedAnswer === null || isAnswerChecked}
                >
                  Final Answer
                </Button>
              </div>
            </div>

            <div className="bg-zinc-900 p-4 rounded-lg border border-zinc-800">
              <h3 className="text-center font-bold mb-4">Prize Ladder</h3>
              <div className="space-y-1">
                {moneyLevels
                  .slice()
                  .reverse()
                  .map((money, index) => {
                    const questionIndex = moneyLevels.length - 1 - index
                    let className = "p-2 rounded text-center text-sm"

                    if (questionIndex === currentQuestion) {
                      className += " bg-[rgb(255,136,0)] text-white font-bold"
                    } else if (questionIndex < currentQuestion) {
                      className += " bg-green-800 text-white"
                    } else {
                      className += " bg-zinc-800 text-white"
                    }

                    // Highlight safe havens (questions 3 and 7)
                    if (questionIndex === 3 || questionIndex === 7) {
                      className += " border-l-4 border-r-4 border-[rgb(255,170,80)]"
                    }

                    return (
                      <div key={index} className={className}>
                        {money}
                      </div>
                    )
                  })}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

