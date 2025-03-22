"use server"

import { generateObject, generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import { z } from "zod"

// Define the schema for a single question
const questionSchema = z.object({
  question: z.string().describe("The question text"),
  options: z.array(z.string()).length(4).describe("Four possible answer options"),
  correctAnswer: z.number().min(0).max(3).describe("Index of the correct answer (0-3)"),
})

// Define the schema for the entire response - now requiring exactly 10 questions
const quizSchema = z.object({
  questions: z.array(questionSchema).length(10).describe("Array of exactly 10 quiz questions"),
})

// Fallback questions in case there are no generated questions - updated to 10 questions
const fallbackQuestions = [
  {
    question: "According to Keynesian economics, what happens during a recession?",
    options: [
      "Government should increase spending",
      "Interest rates should be raised",
      "Taxes should be increased",
      "Money supply should be restricted",
    ],
    correctAnswer: 0,
  },
  {
    question: "The law of diminishing marginal utility states that:",
    options: [
      "Prices rise as demand increases",
      "Satisfaction decreases with each additional unit consumed",
      "Production costs increase with scale",
      "Unemployment rises during inflation",
    ],
    correctAnswer: 1,
  },
  {
    question: "What is the primary goal of monetary policy?",
    options: [
      "Maximize government revenue",
      "Eliminate international trade",
      "Stabilize prices and employment",
      "Increase income inequality",
    ],
    correctAnswer: 2,
  },
  {
    question: "The concept of 'opportunity cost' refers to:",
    options: [
      "The cost of starting a new business",
      "The value of the next best alternative foregone",
      "The cost of borrowing money",
      "The cost of imported goods",
    ],
    correctAnswer: 1,
  },
  {
    question: "What does GDP stand for in economics?",
    options: [
      "Global Development Plan",
      "General Domestic Production",
      "Gross Domestic Product",
      "Government Distribution Program",
    ],
    correctAnswer: 2,
  },
  {
    question: "Which of the following is NOT a factor of production?",
    options: ["Land", "Labor", "Capital", "Inflation"],
    correctAnswer: 3,
  },
  {
    question: "What is a monopoly?",
    options: [
      "A market with many small firms",
      "A single seller with complete control over a market",
      "Government ownership of all businesses",
      "International trade without tariffs",
    ],
    correctAnswer: 1,
  },
  {
    question: "What does the term 'elasticity' measure in economics?",
    options: [
      "The flexibility of labor markets",
      "How responsive quantity is to price changes",
      "The strength of economic growth",
      "The rate of inflation over time",
    ],
    correctAnswer: 1,
  },
  {
    question: "Which economic system relies primarily on the private ownership of resources?",
    options: ["Socialism", "Communism", "Capitalism", "Feudalism"],
    correctAnswer: 2,
  },
  {
    question: "The Phillips Curve shows the relationship between:",
    options: [
      "Inflation and unemployment",
      "Supply and demand",
      "Interest rates and investment",
      "Taxation and government spending",
    ],
    correctAnswer: 0,
  },
]

export async function generateQuestions(formData: FormData) {
  try {
    const inputText = formData.get("inputText") as string

    if (!inputText || inputText.trim().length < 10) {
      return {
        success: false,
        error: "Please provide at least 10 characters to generate questions.",
      }
    }

    // Check if OpenAI API key is available
    const apiKey = process.env.OPENAI_API_KEY

    // If no API key is available, return fallback questions with a default title
    if (!apiKey) {
      console.log("No OpenAI API key found. Using fallback questions.")
      return {
        success: true,
        questions: fallbackQuestions,
        title: "Economics Fundamentals",
        isUsingFallback: true,
      }
    }

    // Generate a title for the question set
    let title = "Quiz Questions"
    try {
      const { text: generatedTitle } = await generateText({
        model: openai("gpt-4o"),
        prompt: `Generate a short, catchy title (5 words or less) for a quiz based on this text: "${inputText.substring(0, 200)}..."`,
      })
      title = generatedTitle.trim()
    } catch (titleError) {
      console.error("Error generating title:", titleError)
      // Continue with default title if title generation fails
    }

    // Generate questions using OpenAI
    const { object } = await generateObject({
      model: openai("gpt-4o"),
      schema: quizSchema,
      prompt: `
        You are an expert quiz creator. Based on the following text, create a set of exactly 10 challenging 
        multiple-choice questions in the style of "Who Wants to Be a Millionaire".
        
        Each question should:
        1. Test understanding of key concepts from the text
        2. Have one clearly correct answer and three plausible but incorrect options
        3. Be arranged from easier to more difficult (question 1 should be easiest, question 10 should be hardest)
        4. Cover different aspects of the provided content
        5. Be interesting and engaging

        Make sure the questions increase in difficulty gradually, with the first few being relatively straightforward
        and the last few being quite challenging even for someone familiar with the material.
        
        Here is the text to base the questions on:
        
        ${inputText}
      `,
    })

    return {
      success: true,
      questions: object.questions,
      title: title,
    }
  } catch (error) {
    console.error("Error generating questions:", error)

    // Return fallback questions if there's an error with the API
    return {
      success: true,
      questions: fallbackQuestions,
      title: "Economics Fundamentals",
      isUsingFallback: true,
      error: "Could not connect to OpenAI. Using demo questions instead.",
    }
  }
}

