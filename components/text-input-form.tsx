"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { generateQuestions } from "@/app/actions"
import { Loader2, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface TextInputFormProps {
  onQuestionsGenerated?: () => void
  hidePlayButton?: boolean
  hideSaveButton?: boolean
}

export default function TextInputForm({
  onQuestionsGenerated,
  hidePlayButton = false,
  hideSaveButton = false,
}: TextInputFormProps) {
  const [inputText, setInputText] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [warning, setWarning] = useState<string | null>(null)
  const [generatedQuestions, setGeneratedQuestions] = useState<any[] | null>(null)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setWarning(null)
    setGeneratedQuestions(null)

    try {
      const formData = new FormData()
      formData.append("inputText", inputText)

      const result = await generateQuestions(formData)

      if (!result.success) {
        setError(result.error)
        setIsLoading(false)
        return
      }

      // If using fallback questions, show a warning
      if (result.isUsingFallback) {
        setWarning(result.error || "Using demo questions. To generate custom questions, add your OpenAI API key.")
      }

      // Validate questions
      if (!Array.isArray(result.questions) || result.questions.length === 0) {
        setError("Failed to generate valid questions. Please try again.")
        setIsLoading(false)
        return
      }

      // Ensure questions are properly formatted
      const validatedQuestions = result.questions.map((q) => ({
        question: String(q.question || ""),
        options: Array.isArray(q.options) ? q.options.map((o) => String(o || "")) : [],
        correctAnswer: Number(q.correctAnswer || 0),
      }))

      // Store the questions in state
      setGeneratedQuestions(validatedQuestions)

      // Store the questions in localStorage to access them in the game page
      localStorage.setItem("quizQuestions", JSON.stringify(validatedQuestions))

      // Notify parent component that questions were generated
      if (onQuestionsGenerated) {
        onQuestionsGenerated()
      }
    } catch (err) {
      console.error("Error generating questions:", err)
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handlePlayGame = () => {
    router.push("/game")
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <textarea
          className="w-full h-64 p-4 bg-zinc-950 border border-zinc-800 rounded-lg text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-[rgb(255,136,0)]"
          placeholder="Paste your research text, article, or study material here..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          required
        />
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {warning && (
        <Alert className="bg-amber-900 border-amber-700">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{warning}</AlertDescription>
        </Alert>
      )}

      {!generatedQuestions ? (
        <div className="flex justify-center">
          <Button
            type="submit"
            className="bg-[rgb(255,136,0)] hover:bg-[rgb(230,120,0)] text-white font-bold text-lg px-8 py-6"
            disabled={isLoading || inputText.trim().length < 10}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Quiz...
              </>
            ) : (
              "Generate Quiz Game"
            )}
          </Button>
        </div>
      ) : (
        <div className="flex flex-col items-center space-y-4">
          <div className="flex justify-center space-x-4">
            {!hidePlayButton && (
              <Button
                type="button"
                className="bg-[rgb(255,136,0)] hover:bg-[rgb(230,120,0)] text-white font-bold"
                onClick={handlePlayGame}
              >
                Play Now
              </Button>
            )}
          </div>

          <div className="text-center text-green-400">✓ Questions generated successfully</div>
        </div>
      )}

      <p className="text-xs text-center text-white/60 mt-4">
        The app will generate 10 questions based on your text, ranging from easy to difficult.
      </p>
    </form>
  )
}