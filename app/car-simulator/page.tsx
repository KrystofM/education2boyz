"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import CarSimulator from "./car-simulator"

export default function CarSimulatorPage() {
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Simulate loading assets
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1500)

    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <header className="border-b border-zinc-800 p-4 relative z-10">
        <div className="container flex justify-between items-center">
          <Button variant="ghost" className="text-white hover:text-white" onClick={() => router.push("/")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
          </Button>
          <h1 className="text-2xl font-bold">
            <span className="text-[rgb(255,0,136)] text-3xl">3D</span> Car Simulator
          </h1>
        </div>
      </header>

      <main className="flex-1 relative">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[rgb(255,0,136)] mx-auto mb-4"></div>
              <p className="text-xl">Loading 3D environment...</p>
            </div>
          </div>
        ) : (
          <CarSimulator />
        )}
      </main>
    </div>
  )
}

