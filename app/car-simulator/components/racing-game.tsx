"use client"

import { useState, useEffect, Suspense, useRef } from "react"
import dynamic from 'next/dynamic'
import { GameProvider } from "./game-context"
import GameUI from "./game-ui"
import QuizModal from "./quiz-modal"
import EndGameScreen from "./end-game-screen"
import { ErrorBoundary } from "./error-boundary"

// Dynamically import Three.js components with ssr: false to prevent hydration issues
const ThreeCanvas = dynamic(() => import('./three-canvas'), { 
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-gray-900 flex items-center justify-center text-white">
      <div>Loading 3D engine...</div>
    </div>
  )
})

// Define types for our questions and quiz results
interface Question {
  question: string;
  options: string[];
  correctAnswer: number;
}

interface QuizResult {
  question: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
}

// Sample questions - replace with your actual questions
const sampleQuestions: Question[] = [
  {
    question: "What is 2+2?",
    options: ["3", "4", "5", "6"],
    correctAnswer: 1,
  },
  {
    question: "What is the capital of France?",
    options: ["London", "Paris", "Berlin", "Madrid"],
    correctAnswer: 1,
  },
  {
    question: "Which planet is closest to the sun?",
    options: ["Earth", "Mars", "Venus", "Mercury"],
    correctAnswer: 3,
  },
  {
    question: "What is the chemical symbol for water?",
    options: ["Wa", "H2O", "O2H", "WaO"],
    correctAnswer: 1,
  },
  {
    question: "Who painted the Mona Lisa?",
    options: ["Van Gogh", "Da Vinci", "Picasso", "Michelangelo"],
    correctAnswer: 1,
  },
]

export default function RacingGame() {
  // Use useRef for stable values that shouldn't trigger re-renders
  const gameStateRef = useRef<string>("start") // start, playing, quiz, end
  const [gameState, setGameState] = useState<string>("start") 
  const [showQuiz, setShowQuiz] = useState<boolean>(false)
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null)
  const [quizResults, setQuizResults] = useState<QuizResult[]>([])
  const [playerPosition, setPlayerPosition] = useState<number>(1) // Always position 1 since no other cars
  const [hasError, setHasError] = useState<boolean>(false)
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [useSimpleMode, setUseSimpleMode] = useState<boolean>(false) // Start with regular mode instead of simple mode

  console.log("RacingGame rendered, game state:", gameState)
  
  // Update the ref whenever state changes
  useEffect(() => {
    gameStateRef.current = gameState
  }, [gameState])

  const startGame = () => {
    console.log("Starting game")
    setGameState("playing")
    setQuizResults([])
  }

  const endGame = () => {
    console.log("Game ended")
    // Always position 1 since we removed other cars
    setPlayerPosition(1)
    setGameState("end")
  }

  const triggerQuiz = () => {
    if (gameStateRef.current === "playing") {
      // Select a random question - use a safer random approach
      const randomIndex = Math.floor(crypto.getRandomValues(new Uint32Array(1))[0] / 4294967296 * sampleQuestions.length)
      setCurrentQuestion(sampleQuestions[randomIndex])
      setShowQuiz(true)
      setGameState("quiz")
    }
  }

  const handleQuizAnswer = (selectedIndex: number) => {
    if (!currentQuestion) return
    
    const isCorrect = selectedIndex === currentQuestion.correctAnswer

    setQuizResults((prev) => [
      ...prev,
      {
        question: currentQuestion.question,
        userAnswer: currentQuestion.options[selectedIndex],
        correctAnswer: currentQuestion.options[currentQuestion.correctAnswer],
        isCorrect,
      },
    ])

    setShowQuiz(false)
    setGameState("playing")
  }

  // Regular game UI
  return (
    <div className="w-full h-full relative">
      {hasError ? (
        <div className="w-full h-full bg-red-100 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-2xl w-full">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Error Occurred</h2>
            <p className="mb-4">{errorMessage}</p>
            <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto max-h-60">
              {errorMessage}
            </pre>
            <div className="flex gap-2 mt-4">
              <button 
                onClick={() => {
                  setHasError(false)
                  window.location.reload()
                }}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              >
                Reload Application
              </button>
            </div>
          </div>
        </div>
      ) : (
        <GameProvider
          value={{
            gameState,
            endGame,
          }}
        >
          <ErrorBoundary
            fallback={
              <div className="w-full h-full bg-red-100 p-8">
                <h2 className="text-2xl font-bold text-red-600 mb-4">3D Rendering Error</h2>
                <p className="mb-4">There was an error rendering the 3D scene.</p>
                <button 
                  onClick={() => window.location.reload()}
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                >
                  Reload Page
                </button>
              </div>
            }
          >
            <ThreeCanvas />
          </ErrorBoundary>
          
          <GameUI gameState={gameState} startGame={startGame} />
          
          {showQuiz && currentQuestion && <QuizModal question={currentQuestion} onAnswer={handleQuizAnswer} />}
          
          {gameState === "end" && (
            <EndGameScreen position={playerPosition} quizResults={quizResults} onRestart={startGame} />
          )}
        </GameProvider>
      )}
    </div>
  )
}

