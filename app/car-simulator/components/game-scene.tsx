"use client"

import { useState, useEffect } from "react"
import { usePlane } from "@react-three/cannon"
import { Vector3 } from "three"
import { useGame } from "./game-context"

export default function GameScene() {
  const { gameState } = useGame()
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    // Mark component as loaded after first render
    console.log("GameScene mounted")
    setLoaded(true)
    
    return () => {
      console.log("GameScene unmounted")
    }
  }, [])

  // Create ground plane - wrap in try-catch to prevent fatal errors
  let groundRef;
  try {
    [groundRef] = usePlane(() => ({
      rotation: [-Math.PI / 2, 0, 0],
      position: [0, 0, 0],
      type: "static",
    }))
    console.log("Ground plane created")
  } catch (error) {
    console.error("Error creating ground plane:", error)
    // Don't return early, continue with fallback
    groundRef = null
  }

  if (!loaded) {
    console.log("GameScene not loaded yet")
    return null; // Don't render anything until component is fully loaded
  }

  console.log("Rendering GameScene with ground ref:", !!groundRef)

  return (
    <>
      {/* Ground - fallback if physics failed */}
      {!groundRef && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
          <planeGeometry args={[100, 100]} />
          <meshStandardMaterial color="#553333" />
        </mesh>
      )}
      
      {/* Ground - with physics if available */}
      {groundRef && (
        <mesh ref={groundRef} receiveShadow>
          <planeGeometry args={[100, 100]} />
          <meshStandardMaterial color="#553333" />
        </mesh>
      )}

      {/* Simple straight road */}
      <mesh position={[0, 0.01, 20]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[10, 100]} />
        <meshStandardMaterial color="#444444" />
      </mesh>
      
      {/* Road markings */}
      <mesh position={[0, 0.02, 20]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.5, 100]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>

      {/* Simple car - no physics for now */}
      <mesh position={[0, 1, 0]} castShadow>
        <boxGeometry args={[1.8, 1, 4]} />
        <meshStandardMaterial color="yellow" />
      </mesh>
    </>
  )
}

