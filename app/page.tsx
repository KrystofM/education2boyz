import { Suspense } from "react"
import { Sparkles, Users } from "lucide-react"
import TextInputForm from "./components/text-input-form"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-black text-white">
      <header className="border-b border-zinc-800 p-4">
        <div className="container flex justify-between items-center">
          <h1 className="text-2xl font-bold">
            <span className="text-[rgb(255,136,0)] text-3xl">E</span>ducation
            <span className="text-[rgb(255,136,0)] text-3xl">2</span>
            <span className="text-[rgb(255,136,0)] text-3xl">B</span>oyz
          </h1>
          <div className="flex gap-2">
            <Link href="/multiplayer">
              <Button className="bg-[rgb(255,136,0)] hover:bg-[rgb(230,120,0)] text-white">
                <Users className="mr-2 h-4 w-4" /> Multiplayer
              </Button>
            </Link>
            <Link href="/car-simulator">
              <Button className="bg-[rgb(255,0,136)] hover:bg-[rgb(230,0,120)] text-white">
                <span className="mr-2">🚗</span> Surprise
              </Button>
            </Link>
          </div>
        </div>
      </header>
      <main className="flex-1 container py-12">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <div className="space-y-2">
            <h2 className="text-4xl font-bold tracking-tight">Turn Any Text Into a Quiz Game</h2>
            <p className="text-xl text-white">
              Paste your research, article, or study material and play a millionaire-style quiz game
            </p>
          </div>

          <div className="bg-zinc-900 p-8 rounded-xl border border-zinc-800 shadow-lg">
            <Suspense fallback={<div>Loading...</div>}>
              <TextInputForm />
            </Suspense>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            <div className="bg-zinc-900 p-6 rounded-lg border border-zinc-800">
              <Sparkles className="h-10 w-10 text-[rgb(255,136,0)] mb-2" />
              <h3 className="text-xl font-bold">Learn While Playing</h3>
              <p className="text-white mt-2">Transform boring study material into an engaging quiz game</p>
            </div>
            <div className="bg-zinc-900 p-6 rounded-lg border border-zinc-800">
              <Sparkles className="h-10 w-10 text-[rgb(255,136,0)] mb-2" />
              <h3 className="text-xl font-bold">Authentic Experience</h3>
              <p className="text-white mt-2">Enjoy lifelines, money ladder, and all the excitement of the show</p>
            </div>
            <div className="bg-zinc-900 p-6 rounded-lg border border-zinc-800">
              <Users className="h-10 w-10 text-[rgb(255,136,0)] mb-2" />
              <h3 className="text-xl font-bold">Multiplayer Mode</h3>
              <p className="text-white mt-2">Compete with friends in a Kahoot-style quiz game with points and timing</p>
            </div>
          </div>
        </div>
      </main>
      <footer className="border-t border-zinc-800 py-6 text-center text-white">
        <div className="container">
          <p>
            © {new Date().getFullYear()}{" "}
            <span className="font-bold">
              <span className="text-[rgb(255,136,0)]">E</span>ducation
              <span className="text-[rgb(255,136,0)]">2</span>
              <span className="text-[rgb(255,136,0)]">B</span>oyz
            </span>
            . All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}

