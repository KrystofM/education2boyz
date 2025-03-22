"use client"

import { useState } from "react"

export default function QuizModal({ question, onAnswer }) {
  const [selectedAnswer, setSelectedAnswer] = useState(null)

  const handleSubmit = () => {
    if (selectedAnswer !== null) {
      onAnswer(selectedAnswer)
    }
  }

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
        <h2 className="text-xl font-bold mb-4">Quiz Question</h2>
        <p className="mb-4">{question.question}</p>

        <div className="space-y-2 mb-6">
          {question.options.map((option, index) => (
            <button
              key={index}
              className={`w-full p-3 text-left rounded-lg border ${
                selectedAnswer === index ? "bg-blue-100 border-blue-500" : "border-gray-300 hover:bg-gray-50"
              }`}
              onClick={() => setSelectedAnswer(index)}
            >
              {option}
            </button>
          ))}
        </div>

        <button
          className={`w-full py-2 rounded-lg font-bold ${
            selectedAnswer !== null
              ? "bg-blue-600 text-white hover:bg-blue-700"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
          onClick={handleSubmit}
          disabled={selectedAnswer === null}
        >
          Submit Answer
        </button>
      </div>
    </div>
  )
}

