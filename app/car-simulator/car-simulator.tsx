"use client"

import { useRef, useState, useEffect } from "react"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { Environment, PerspectiveCamera, Grid, Html } from "@react-three/drei"
import * as THREE from "three"

// Camera that follows the car without tilting
function FollowCamera({
  target,
}: {
  target: { position: { x: number; y: number; z: number }; rotation: number }
}) {
  const { camera } = useThree()

  useFrame(() => {
    // Fixed distance directly behind the car
    const distance = 8
    const height = 3

    // Calculate position directly behind the car based on car's rotation
    const offsetX = Math.sin(target.rotation) * distance
    const offsetZ = Math.cos(target.rotation) * distance

    // Set camera position
    const targetPosition = new THREE.Vector3(
      target.position.x - offsetX,
      target.position.y + height,
      target.position.z + offsetZ,
    )

    // Smoothly move camera
    camera.position.lerp(targetPosition, 0.1)

    // Look at the car
    camera.lookAt(target.position.x, target.position.y + 0.5, target.position.z)
  })

  return null
}

// Wheel component with rotation
function Wheel({
  position,
  rotation = 0,
  steer = 0,
  isFront = false,
}: {
  position: [number, number, number]
  rotation?: number
  steer?: number
  isFront?: boolean
}) {
  const wheelRef = useRef<THREE.Mesh>(null)

  useFrame(() => {
    if (wheelRef.current) {
      // Apply steering rotation (y-axis) only to front wheels
      if (isFront) {
        wheelRef.current.rotation.y = steer
      }

      // Apply forward rotation (z-axis)
      wheelRef.current.rotation.z = rotation
    }
  })

  return (
    <mesh ref={wheelRef} position={position} castShadow rotation={[0, 0, 0]}>
      {/* Properly oriented wheel - standing vertically parallel to car sides */}
      <cylinderGeometry args={[0.5, 0.5, 0.4, 16]} rotation={[0, 0, Math.PI / 2]} />
      <meshStandardMaterial color="black" />
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.3, 0.3, 0.41, 16]} rotation={[0, 0, Math.PI / 2]} />
        <meshStandardMaterial color="gray" />
      </mesh>
    </mesh>
  )
}

// Simple car with improved controls
function Car() {
  const carRef = useRef<THREE.Group>(null)
  const [position, setPosition] = useState({ x: 0, y: 0.5, z: 0 })
  const [rotation, setRotation] = useState(0)
  const [speed, setSpeed] = useState(0)
  const [wheelRotation, setWheelRotation] = useState(0)
  const [steeringAngle, setSteeringAngle] = useState(0)
  const [showBrakeLights, setShowBrakeLights] = useState(false)

  // Track key states
  const [controls, setControls] = useState({
    forward: false,
    backward: false,
    left: false,
    right: false,
    handbrake: false,
  })

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp" || e.key === "w") setControls((prev) => ({ ...prev, forward: true }))
      if (e.key === "ArrowDown" || e.key === "s") setControls((prev) => ({ ...prev, backward: true }))
      if (e.key === "ArrowLeft" || e.key === "a") setControls((prev) => ({ ...prev, left: true }))
      if (e.key === "ArrowRight" || e.key === "d") setControls((prev) => ({ ...prev, right: true }))
      if (e.key === " ") setControls((prev) => ({ ...prev, handbrake: true }))
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp" || e.key === "w") setControls((prev) => ({ ...prev, forward: false }))
      if (e.key === "ArrowDown" || e.key === "s") setControls((prev) => ({ ...prev, backward: false }))
      if (e.key === "ArrowLeft" || e.key === "a") setControls((prev) => ({ ...prev, left: false }))
      if (e.key === "ArrowRight" || e.key === "d") setControls((prev) => ({ ...prev, right: false }))
      if (e.key === " ") setControls((prev) => ({ ...prev, handbrake: false }))
    }

    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("keyup", handleKeyUp)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("keyup", handleKeyUp)
    }
  }, [])

  // Update car position and rotation based on controls
  useFrame(() => {
    // Simplified car physics parameters
    const maxSpeed = 0.3
    const acceleration = 0.01
    const deceleration = 0.005
    const brakeForce = 0.02
    const maxSteeringAngle = 0.8
    const steeringSpeed = 0.1
    const steeringReturnSpeed = 0.1

    // Simple speed control
    if (controls.forward) {
      setSpeed((prev) => Math.min(maxSpeed, prev + acceleration))
      setShowBrakeLights(false)
    } else if (controls.backward) {
      if (speed > 0.01) {
        // Braking
        setSpeed((prev) => Math.max(0, prev - brakeForce))
        setShowBrakeLights(true)
      } else {
        // Reverse
        setSpeed((prev) => Math.max(-maxSpeed / 2, prev - acceleration))
        setShowBrakeLights(false)
      }
    } else {
      // Decelerate when no input
      setShowBrakeLights(false)
      if (speed > 0) {
        setSpeed((prev) => Math.max(0, prev - deceleration))
      } else if (speed < 0) {
        setSpeed((prev) => Math.min(0, prev + deceleration))
      }
    }

    // Simple steering control
    if (controls.left) {
      setSteeringAngle((prev) => Math.min(maxSteeringAngle, prev + steeringSpeed))
    } else if (controls.right) {
      setSteeringAngle((prev) => Math.max(-maxSteeringAngle, prev - steeringSpeed))
    } else {
      // Return steering to center
      if (steeringAngle > 0) {
        setSteeringAngle((prev) => Math.max(0, prev - steeringReturnSpeed))
      } else if (steeringAngle < 0) {
        setSteeringAngle((prev) => Math.min(0, prev + steeringReturnSpeed))
      }
    }

    // Update rotation based on steering and speed
    if (Math.abs(speed) > 0.01) {
      const turnEffect = steeringAngle * Math.abs(speed) * 2
      setRotation((prev) => prev + turnEffect)
    }

    // Calculate new position - always move in the direction the car is facing
    const moveX = Math.sin(rotation) * speed
    const moveZ = Math.cos(rotation) * speed

    // Update position
    setPosition((prev) => ({
      x: prev.x + moveX,
      y: prev.y,
      z: prev.z - moveZ, // Negative because forward is negative z in Three.js
    }))

    // Update wheel rotation based on speed
    setWheelRotation((prev) => prev + speed * 0.5)

    // Apply position and rotation to the car
    if (carRef.current) {
      carRef.current.position.set(position.x, position.y, position.z)
      carRef.current.rotation.y = rotation
    }
  })

  return (
    <>
      <FollowCamera target={{ position, rotation }} />

      <group ref={carRef} position={[position.x, position.y, position.z]} rotation={[0, rotation, 0]}>
        {/* Car body */}
        <mesh castShadow position={[0, 0, 0]}>
          <boxGeometry args={[2, 1, 4]} />
          <meshStandardMaterial color="hotpink" />
        </mesh>

        {/* Car roof */}
        <mesh castShadow position={[0, 0.8, -0.5]}>
          <boxGeometry args={[1.8, 0.6, 2]} />
          <meshStandardMaterial color="hotpink" />
        </mesh>

        {/* Wheels with steering and rotation */}
        <Wheel position={[1, -0.5, 1.5]} rotation={wheelRotation} />
        <Wheel position={[-1, -0.5, 1.5]} rotation={wheelRotation} />
        <Wheel position={[1, -0.5, -1.5]} rotation={wheelRotation} steer={steeringAngle} isFront={true} />
        <Wheel position={[-1, -0.5, -1.5]} rotation={wheelRotation} steer={steeringAngle} isFront={true} />

        {/* Headlights */}
        <mesh castShadow position={[0.8, 0, -2]}>
          <boxGeometry args={[0.3, 0.3, 0.1]} />
          <meshStandardMaterial color="yellow" emissive="yellow" emissiveIntensity={2} />
        </mesh>
        <mesh castShadow position={[-0.8, 0, -2]}>
          <boxGeometry args={[0.3, 0.3, 0.1]} />
          <meshStandardMaterial color="yellow" emissive="yellow" emissiveIntensity={2} />
        </mesh>

        {/* Brake lights */}
        <mesh castShadow position={[0.8, 0, 2]}>
          <boxGeometry args={[0.3, 0.3, 0.1]} />
          <meshStandardMaterial color="red" emissive="red" emissiveIntensity={showBrakeLights ? 3 : 0.2} />
        </mesh>
        <mesh castShadow position={[-0.8, 0, 2]}>
          <boxGeometry args={[0.3, 0.3, 0.1]} />
          <meshStandardMaterial color="red" emissive="red" emissiveIntensity={showBrakeLights ? 3 : 0.2} />
        </mesh>

        {/* Speedometer */}
        <Html position={[0, 2, 0]} transform>
          <div className="bg-black/80 text-white p-2 rounded-md text-sm whitespace-nowrap">
            <div>Speed: {Math.abs(Math.round(speed * 100))} km/h</div>
          </div>
        </Html>
      </group>
    </>
  )
}

// Ground component
function Ground() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
      <planeGeometry args={[100, 100]} />
      <meshStandardMaterial color="#303030" />
      <Grid infiniteGrid cellSize={1} cellThickness={0.6} sectionSize={5} sectionThickness={1.2} fadeDistance={50} />
    </mesh>
  )
}

// Obstacle component
function Obstacle({ position }: { position: [number, number, number] }) {
  return (
    <mesh position={position} castShadow>
      <boxGeometry args={[2, 2, 2]} />
      <meshStandardMaterial color="crimson" />
    </mesh>
  )
}

// Instructions component
function Instructions() {
  return (
    <div className="absolute bottom-4 left-4 bg-black/70 p-4 rounded-lg text-white max-w-xs">
      <h3 className="font-bold mb-2">Controls:</h3>
      <ul className="space-y-1 text-sm">
        <li>W / ↑ - Accelerate</li>
        <li>S / ↓ - Brake/Reverse</li>
        <li>A / ← - Turn Left</li>
        <li>D / → - Turn Right</li>
      </ul>
    </div>
  )
}

// Main component
export default function CarSimulator() {
  return (
    <div className="w-full h-screen">
      <Canvas shadows>
        <PerspectiveCamera makeDefault position={[0, 5, 10]} fov={60} />
        <ambientLight intensity={0.5} />
        <directionalLight
          position={[10, 10, 5]}
          intensity={1}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />

        <Car />
        <Ground />

        {/* Obstacles */}
        <Obstacle position={[10, 1, 10]} />
        <Obstacle position={[-10, 1, -10]} />
        <Obstacle position={[10, 1, -10]} />
        <Obstacle position={[-10, 1, 10]} />

        {/* Create a simple track with obstacles */}
        {Array.from({ length: 10 }).map((_, i) => (
          <Obstacle key={`track-1-${i}`} position={[15, 1, -20 + i * 5]} />
        ))}
        {Array.from({ length: 10 }).map((_, i) => (
          <Obstacle key={`track-2-${i}`} position={[-15, 1, -20 + i * 5]} />
        ))}

        <Environment preset="sunset" />
      </Canvas>

      <Instructions />

      {/* Mobile controls */}
      <div className="md:hidden fixed bottom-20 right-4 grid grid-cols-3 gap-2">
        <button className="bg-black/50 w-12 h-12 rounded-full flex items-center justify-center border border-white/30">
          ←
        </button>
        <button className="bg-black/50 w-12 h-12 rounded-full flex items-center justify-center border border-white/30">
          ↑
        </button>
        <button className="bg-black/50 w-12 h-12 rounded-full flex items-center justify-center border border-white/30">
          →
        </button>
        <div></div>
        <button className="bg-black/50 w-12 h-12 rounded-full flex items-center justify-center border border-white/30">
          ↓
        </button>
        <div></div>
      </div>
    </div>
  )
}

