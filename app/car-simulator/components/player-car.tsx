"use client"

import { useRef, useState, useEffect } from "react"
import { useFrame, useThree } from "@react-three/fiber"
import { useBox } from "@react-three/cannon"
import { Vector3, Mesh } from "three"
import { useGame } from "./game-context"

interface PlayerCarProps {
  position: { x: number; y: number; z: number };
  raceStarted: boolean;
}

export default function PlayerCar({ position, raceStarted }: PlayerCarProps) {
  const { gameState, endGame } = useGame()
  const { camera } = useThree()
  const carRef = useRef<Mesh>(null)

  // Use a try-catch to prevent physics errors from crashing the app
  let carPhysicsRef, carApi;
  try {
    [carPhysicsRef, carApi] = useBox(() => ({
    mass: 500,
      position: [0, 1, 0],
      args: [1.8, 1, 4],
    allowSleep: false,
    linearDamping: 0.5,
    angularDamping: 0.5,
  }))
  } catch (error) {
    console.error("Physics error:", error)
    // Return a simple non-physics car
    return (
      <mesh position={[0, 1, 0]}>
        <boxGeometry args={[1.8, 1, 4]} />
        <meshStandardMaterial color="yellow" />
      </mesh>
    )
  }

  // Simplified car state
  const [controls, setControls] = useState({
    forward: false,
    backward: false,
    left: false,
    right: false,
  })

  const [position_z, setPosition_z] = useState(0)
  
  // Progress tracking - simplified for a straight line
  useEffect(() => {
    if (position_z > 40 && gameState === "playing") {
      // Reach the finish line (now in positive z direction)
      endGame(1) // Player always finishes in position 1
    }
  }, [position_z, gameState, endGame])

  // Handle keyboard input
  useEffect(() => {
    if (!raceStarted) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== "playing") return

      const key = e.key.toLowerCase()
      if (key === "w" || key === "arrowup") setControls(prev => ({ ...prev, forward: true }))
      if (key === "s" || key === "arrowdown") setControls(prev => ({ ...prev, backward: true }))
      if (key === "a" || key === "arrowleft") setControls(prev => ({ ...prev, left: true }))
      if (key === "d" || key === "arrowright") setControls(prev => ({ ...prev, right: true }))
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase()
      if (key === "w" || key === "arrowup") setControls(prev => ({ ...prev, forward: false }))
      if (key === "s" || key === "arrowdown") setControls(prev => ({ ...prev, backward: false }))
      if (key === "a" || key === "arrowleft") setControls(prev => ({ ...prev, left: false }))
      if (key === "d" || key === "arrowright") setControls(prev => ({ ...prev, right: false }))
    }

    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("keyup", handleKeyUp)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("keyup", handleKeyUp)
    }
  }, [raceStarted, gameState])

  // Fixed movement for a straight road - changed to manual positioning to fix movement issues
  useFrame((state, delta) => {
    if (!raceStarted || !carPhysicsRef.current || gameState !== "playing") return

    try {
      const speed = 20 * delta
      let moveZ = 0
      
      // Reversed direction - forward now moves in positive Z
      if (controls.forward) moveZ = speed 
      if (controls.backward) moveZ = -speed
      
      let moveX = 0
      if (controls.left) moveX = -speed * 0.5
      if (controls.right) moveX = speed * 0.5
      
      // Get current position
      const currentPos = new Vector3();
      carPhysicsRef.current.getWorldPosition(currentPos);
      
      // Calculate new position
      const newX = Math.max(-4, Math.min(4, currentPos.x + moveX));
      const newZ = currentPos.z + moveZ;
      
      // Apply movement directly 
      carApi.position.set(newX, 1, newZ);
      
      // Store z position for progress tracking
      setPosition_z(newZ);
      
      // Update camera position
      const cameraOffset = new Vector3(0, 5, -10); // Camera behind the car
      camera.position.copy(new Vector3(newX, 1, newZ)).add(cameraOffset);
      camera.lookAt(new Vector3(newX, 1, newZ));
    } catch (error) {
      console.error("Car update error:", error);
    }
  });

  // Render a simple car
  return (
    <mesh ref={carPhysicsRef} castShadow>
      <boxGeometry args={[1.8, 1, 4]} />
      <meshStandardMaterial color="#ffff00" />
    </mesh>
  )
}

