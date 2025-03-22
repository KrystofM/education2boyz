"use client"

import { useEffect, useState, useRef, useMemo } from "react"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { Physics, usePlane, useBox } from "@react-three/cannon"
import { Vector3, Euler } from "three"
import { ErrorBoundary } from "./error-boundary"
import { Html } from "@react-three/drei"

export default function ThreeCanvas() {
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    console.log("ThreeCanvas mounted")
    setMounted(true)
  }, [])
  
  if (!mounted) {
    console.log("Waiting for mount...")
    return <div className="w-full h-full bg-black flex items-center justify-center text-white">Loading 3D scene...</div>
  }

  console.log("Attempting to render Canvas")
  
  return (
    <ErrorBoundary>
      <div className="w-full h-full relative">
        <Canvas
          camera={{ position: [0, 5, 10], fov: 60 }}
          onCreated={() => console.log("Canvas created successfully")}
          onError={(e) => console.error("Canvas error:", e)}
        >
          <color attach="background" args={["#87CEEB"]} />
          <ambientLight intensity={1.0} />
          <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
          
          {/* Add physics with minimal settings */}
          <Physics 
            gravity={[0, -9.8, 0]}
            defaultContactMaterial={{
              friction: 0.1,
              restitution: 0.1
            }}
          >
            <SimplifiedScene />
          </Physics>
        </Canvas>
      </div>
    </ErrorBoundary>
  )
}

// Quiz wall with answers
function QuizWall({ position, correctDoor }) {
  const wallHeight = 6
  const wallWidth = 20
  const doorWidth = 4
  const doorHeight = 4
  const doorPositions = [-6, 0, 6] // Left, center, right positions
  
  // Create static barriers for the incorrect doors
  const [leftWallRef] = useBox(() => ({
    args: [doorWidth, doorHeight, 0.5],
    position: [position.x + doorPositions[0], position.y + doorHeight/2, position.z],
    type: "static",
    isTrigger: correctDoor !== 0,
  }))
  
  const [centerWallRef] = useBox(() => ({
    args: [doorWidth, doorHeight, 0.5],
    position: [position.x + doorPositions[1], position.y + doorHeight/2, position.z],
    type: "static",
    isTrigger: correctDoor !== 1,
  }))
  
  const [rightWallRef] = useBox(() => ({
    args: [doorWidth, doorHeight, 0.5],
    position: [position.x + doorPositions[2], position.y + doorHeight/2, position.z],
    type: "static",
    isTrigger: correctDoor !== 2,
  }))
  
  return (
    <group position={[position.x, position.y, position.z]}>
      {/* Main wall structure */}
      <mesh position={[0, wallHeight/2, 0]} castShadow receiveShadow>
        <boxGeometry args={[wallWidth, wallHeight, 0.5]} />
        <meshStandardMaterial color="#555555" />
      </mesh>
      
      {/* Door frames */}
      {doorPositions.map((x, index) => (
        <group key={index} position={[x, 0, 0]}>
          {/* Door frame */}
          <mesh position={[0, doorHeight/2, 0]} castShadow receiveShadow>
            <boxGeometry args={[doorWidth, doorHeight, 0.5]} />
            <meshStandardMaterial color="#222222" />
          </mesh>
          
          {/* Door content - colored differently based on whether it's the correct answer */}
          <mesh 
            position={[0, doorHeight/2, 0.1]} 
            castShadow 
            receiveShadow
            ref={index === 0 ? leftWallRef : index === 1 ? centerWallRef : rightWallRef}
          >
            <boxGeometry args={[doorWidth - 0.5, doorHeight - 0.5, 0.1]} />
            <meshStandardMaterial 
              color={correctDoor === index ? "#00ff00" : "#ff0000"} 
              transparent 
              opacity={0.8} 
            />
          </mesh>
          
          {/* Label */}
          <Html position={[0, doorHeight/2, 0.2]}>
            <div style={{ 
              width: "50px", 
              height: "50px", 
              background: "#ffffff", 
              borderRadius: "50%", 
              display: "flex", 
              justifyContent: "center", 
              alignItems: "center",
              fontSize: "24px",
              fontWeight: "bold"
            }}>
              {index === 0 ? "A" : index === 1 ? "B" : "C"}
            </div>
          </Html>
        </group>
      ))}
    </group>
  )
}

// Simplified scene with straight track
function SimplifiedScene() {
  console.log("Rendering SimplifiedScene")
  
  // Create a ground plane with usePlane
  const [groundRef] = usePlane(() => ({
    rotation: [-Math.PI / 2, 0, 0],
    position: [0, 0, 0],
    type: "static",
  }))
  
  // Define the correct door (randomly chosen when component is first rendered)
  const correctDoor = useMemo(() => Math.floor(Math.random() * 3), [])
  
  return (
    <>
      {/* Ground plane */}
      <mesh ref={groundRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial color="#553333" />
      </mesh>
      
      {/* Straight Track */}
      <group position={[0, 0.01, 0]}>
        {/* Long straight road */}
        <mesh rotation={[-Math.PI/2, 0, 0]} position={[0, 0, 0]} receiveShadow>
          <planeGeometry args={[12, 200]} />
          <meshStandardMaterial color="#444444" />
        </mesh>
        
        {/* Road lines */}
        <mesh rotation={[-Math.PI/2, 0, 0]} position={[-4, 0.01, 0]}>
          <planeGeometry args={[0.3, 200]} />
          <meshStandardMaterial color="white" />
        </mesh>
        
        <mesh rotation={[-Math.PI/2, 0, 0]} position={[4, 0.01, 0]}>
          <planeGeometry args={[0.3, 200]} />
          <meshStandardMaterial color="white" />
        </mesh>
        
        {/* Center dashed line */}
        {Array.from({ length: 40 }).map((_, i) => (
          <mesh 
            key={`dash-${i}`}
            rotation={[-Math.PI/2, 0, 0]} 
            position={[0, 0.01, -95 + i * 5]} 
          >
            <planeGeometry args={[0.3, 2]} />
            <meshStandardMaterial color="white" />
          </mesh>
        ))}
      </group>
      
      {/* Quiz wall with doors */}
      <QuizWall position={{x: 0, y: 0, z: -30}} correctDoor={correctDoor} />
      
      {/* Start/Finish line */}
      <mesh rotation={[-Math.PI/2, 0, 0]} position={[0, 0.02, -90]} receiveShadow>
        <planeGeometry args={[12, 2]} />
        <meshStandardMaterial color="white" />
      </mesh>
      
      {/* Checkered pattern for finish line */}
      {Array.from({ length: 12 }).map((_, i) => (
        <mesh 
          key={`checker-${i}`}
          rotation={[-Math.PI/2, 0, 0]} 
          position={[-5.5 + i, 0.025, -90]} 
          receiveShadow
        >
          <planeGeometry args={[1, 2]} />
          <meshStandardMaterial color={i % 2 === 0 ? "black" : "white"} />
        </mesh>
      ))}
      
      {/* Car with improved modeling */}
      <Car />
    </>
  )
}

// Improved car component with better styling
function Car() {
  const { camera } = useThree()
  const carRef = useRef()
  
  // Game state
  const [gameActive, setGameActive] = useState(true)
  const [score, setScore] = useState(1000)
  const [gameOver, setGameOver] = useState(false)
  
  // Car state
  const [position, setPosition] = useState({ x: 0, y: 1, z: -80 }) // Start near the beginning of the track
  const [rotation, setRotation] = useState(0)
  const [velocity, setVelocity] = useState(0)
  const [steering, setSteering] = useState(0)
  const [lastPosition, setLastPosition] = useState(-80) // Track last z position for finish line detection
  
  // Control state
  const [controls, setControls] = useState({
    forward: false,
    backward: false,
    left: false,
    right: false,
  })
  
  // Score timer
  useEffect(() => {
    if (!gameActive) return;
    
    const interval = setInterval(() => {
      setScore(prev => {
        const newScore = prev - 1;
        return newScore > 0 ? newScore : 0;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [gameActive]);
  
  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!gameActive) return;
      
      const key = e.key.toLowerCase()
      if (key === 'w' || key === 'arrowup') setControls(prev => ({ ...prev, forward: true }))
      if (key === 's' || key === 'arrowdown') setControls(prev => ({ ...prev, backward: true }))
      if (key === 'a' || key === 'arrowleft') setControls(prev => ({ ...prev, left: true }))
      if (key === 'd' || key === 'arrowright') setControls(prev => ({ ...prev, right: true }))
      if (key === 'r' && gameOver) window.location.reload();
    }

    const handleKeyUp = (e) => {
      if (!gameActive) return;
      
      const key = e.key.toLowerCase()
      if (key === 'w' || key === 'arrowup') setControls(prev => ({ ...prev, forward: false }))
      if (key === 's' || key === 'arrowdown') setControls(prev => ({ ...prev, backward: false }))
      if (key === 'a' || key === 'arrowleft') setControls(prev => ({ ...prev, left: false }))
      if (key === 'd' || key === 'arrowright') setControls(prev => ({ ...prev, right: false }))
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [gameActive, gameOver])
  
  // Car physics and movement
  useFrame((state, delta) => {
    if (!gameActive) return;
    
    // Update velocity based on controls
    const acceleration = 10 * delta
    const deceleration = 5 * delta
    const maxSpeed = 20
    const steeringSpeed = 2 * delta
    const maxSteering = 0.5
    
    // Acceleration/deceleration
    if (controls.forward) {
      setVelocity(prev => Math.min(prev + acceleration, maxSpeed))
    } else if (controls.backward) {
      setVelocity(prev => Math.max(prev - acceleration, -maxSpeed/2))
    } else {
      // Natural deceleration
      if (velocity > 0) {
        setVelocity(prev => Math.max(prev - deceleration, 0))
      } else if (velocity < 0) {
        setVelocity(prev => Math.min(prev + deceleration, 0))
      }
    }
    
    // Steering - only when moving
    if (Math.abs(velocity) > 0.1) {
      if (controls.left) {
        setSteering(prev => Math.min(prev + steeringSpeed, maxSteering))
      } else if (controls.right) {
        setSteering(prev => Math.max(prev - steeringSpeed, -maxSteering))
      } else {
        // Return steering to center
        if (steering > 0) {
          setSteering(prev => Math.max(prev - steeringSpeed, 0))
        } else if (steering < 0) {
          setSteering(prev => Math.min(prev + steeringSpeed, 0))
        }
      }
    }
    
    // Apply velocity and steering
    if (Math.abs(velocity) > 0.1) {
      // Calculate new position based on current rotation and velocity
      const distance = velocity * delta
      const newX = position.x + Math.sin(rotation) * distance
      const newZ = position.z + Math.cos(rotation) * distance
      
      // Simplified finish line detection at z = -90
      const crossingFinishLine = 
        (lastPosition < -90 && newZ >= -90) || 
        (lastPosition > -90 && newZ <= -90)
      
      if (crossingFinishLine) {
        // Detect direction - only count when going forward (increasing z)
        if (lastPosition < -90 && newZ >= -90) {
          // End the game
          setGameActive(false);
          setGameOver(true);
          console.log(`Game over! Final score: ${score}`);
        }
      }
      
      // Update position
      setPosition({
        x: newX,
        y: position.y,
        z: newZ
      })
      
      // Track last position for finish line detection
      setLastPosition(newZ)
      
      // Update rotation (steering only affects rotation while moving)
      const steeringAmount = steering * velocity * delta
      setRotation(prev => prev + steeringAmount)
    }
    
    // Update camera to follow car
    if (carRef.current) {
      // Position camera behind the car
      const cameraDistance = 10
      const cameraHeight = 5
      const cameraX = position.x - Math.sin(rotation) * cameraDistance
      const cameraZ = position.z - Math.cos(rotation) * cameraDistance
      
      camera.position.set(cameraX, position.y + cameraHeight, cameraZ)
      camera.lookAt(position.x, position.y, position.z)
    }
  })
  
  return (
    <>
      <group ref={carRef} position={[position.x, position.y, position.z]} rotation={[0, rotation, 0]}>
        {/* Main car body - lower part */}
        <mesh position={[0, 0, 0]} castShadow>
          <boxGeometry args={[1.8, 0.6, 4]} />
          <meshStandardMaterial color="red" />
        </mesh>
        
        {/* Car top/cabin */}
        <mesh position={[0, 0.5, -0.2]} castShadow>
          <boxGeometry args={[1.6, 0.6, 2]} />
          <meshStandardMaterial color="red" />
        </mesh>
        
        {/* Front windshield */}
        <mesh position={[0, 0.5, 0.9]} rotation={[0.3, 0, 0]} castShadow>
          <boxGeometry args={[1.55, 0.6, 0.1]} />
          <meshStandardMaterial color="#aaddff" metalness={0.3} roughness={0.2} />
        </mesh>
        
        {/* Rear windshield */}
        <mesh position={[0, 0.5, -1.3]} rotation={[-0.3, 0, 0]} castShadow>
          <boxGeometry args={[1.55, 0.6, 0.1]} />
          <meshStandardMaterial color="#aaddff" metalness={0.3} roughness={0.2} />
        </mesh>
        
        {/* Hood */}
        <mesh position={[0, 0.25, 1.5]} castShadow>
          <boxGeometry args={[1.7, 0.1, 1]} />
          <meshStandardMaterial color="red" />
        </mesh>
        
        {/* Trunk */}
        <mesh position={[0, 0.25, -1.8]} castShadow>
          <boxGeometry args={[1.7, 0.1, 0.4]} />
          <meshStandardMaterial color="red" />
        </mesh>
        
        {/* Front bumper */}
        <mesh position={[0, 0, 1.95]} castShadow>
          <boxGeometry args={[1.8, 0.4, 0.1]} />
          <meshStandardMaterial color="#111111" />
        </mesh>
        
        {/* Rear bumper */}
        <mesh position={[0, 0, -1.95]} castShadow>
          <boxGeometry args={[1.8, 0.4, 0.1]} />
          <meshStandardMaterial color="#111111" />
        </mesh>
        
        {/* Headlights */}
        <mesh position={[0.6, 0.2, 1.96]} castShadow>
          <boxGeometry args={[0.4, 0.2, 0.05]} />
          <meshStandardMaterial color="white" emissive="white" emissiveIntensity={0.5} />
        </mesh>
        <mesh position={[-0.6, 0.2, 1.96]} castShadow>
          <boxGeometry args={[0.4, 0.2, 0.05]} />
          <meshStandardMaterial color="white" emissive="white" emissiveIntensity={0.5} />
        </mesh>
        
        {/* Taillights */}
        <mesh position={[0.6, 0.2, -1.96]} castShadow>
          <boxGeometry args={[0.4, 0.2, 0.05]} />
          <meshStandardMaterial color="red" emissive="red" emissiveIntensity={0.5} />
        </mesh>
        <mesh position={[-0.6, 0.2, -1.96]} castShadow>
          <boxGeometry args={[0.4, 0.2, 0.05]} />
          <meshStandardMaterial color="red" emissive="red" emissiveIntensity={0.5} />
        </mesh>
        
        {/* Wheels - positioned correctly */}
        <mesh position={[0.9, -0.2, 1.3]} rotation={[0, 0, Math.PI/2]}>
          <cylinderGeometry args={[0.4, 0.4, 0.3, 16]} />
          <meshStandardMaterial color="black" />
        </mesh>
        <mesh position={[-0.9, -0.2, 1.3]} rotation={[0, 0, Math.PI/2]}>
          <cylinderGeometry args={[0.4, 0.4, 0.3, 16]} />
          <meshStandardMaterial color="black" />
        </mesh>
        <mesh position={[0.9, -0.2, -1.3]} rotation={[0, 0, Math.PI/2]}>
          <cylinderGeometry args={[0.4, 0.4, 0.3, 16]} />
          <meshStandardMaterial color="black" />
        </mesh>
        <mesh position={[-0.9, -0.2, -1.3]} rotation={[0, 0, Math.PI/2]}>
          <cylinderGeometry args={[0.4, 0.4, 0.3, 16]} />
          <meshStandardMaterial color="black" />
        </mesh>
        
        {/* Wheel hubcaps */}
        <mesh position={[1.05, -0.2, 1.3]} rotation={[0, 0, Math.PI/2]}>
          <cylinderGeometry args={[0.2, 0.2, 0.05, 16]} />
          <meshStandardMaterial color="silver" metalness={0.8} roughness={0.2} />
        </mesh>
        <mesh position={[-1.05, -0.2, 1.3]} rotation={[0, 0, Math.PI/2]}>
          <cylinderGeometry args={[0.2, 0.2, 0.05, 16]} />
          <meshStandardMaterial color="silver" metalness={0.8} roughness={0.2} />
        </mesh>
        <mesh position={[1.05, -0.2, -1.3]} rotation={[0, 0, Math.PI/2]}>
          <cylinderGeometry args={[0.2, 0.2, 0.05, 16]} />
          <meshStandardMaterial color="silver" metalness={0.8} roughness={0.2} />
        </mesh>
        <mesh position={[-1.05, -0.2, -1.3]} rotation={[0, 0, Math.PI/2]}>
          <cylinderGeometry args={[0.2, 0.2, 0.05, 16]} />
          <meshStandardMaterial color="silver" metalness={0.8} roughness={0.2} />
        </mesh>
      </group>
      
      {/* Score UI */}
      <Html position={[0, 5, 0]} center>
        <div style={{
          background: 'rgba(0,0,0,0.7)',
          color: 'white',
          padding: '10px',
          borderRadius: '5px',
          fontFamily: 'Arial',
          fontSize: '18px',
          width: '200px',
          textAlign: 'center'
        }}>
          <div>Score: {score}</div>
        </div>
      </Html>
      
      {/* Game Over screen */}
      {gameOver && (
        <Html position={[0, 0, 0]} center fullscreen>
          <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            background: 'rgba(0,0,0,0.7)',
          }}>
            <div style={{
              background: 'white',
              padding: '20px',
              borderRadius: '10px',
              textAlign: 'center',
            }}>
              <h1 style={{ fontSize: '24px', marginBottom: '20px' }}>Game Over!</h1>
              <p style={{ fontSize: '20px', marginBottom: '20px' }}>Final Score: {score}</p>
              <button 
                style={{
                  padding: '10px 20px',
                  fontSize: '16px',
                  background: '#4CAF50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer'
                }}
                onClick={() => window.location.reload()}
              >
                Play Again
              </button>
            </div>
          </div>
        </Html>
      )}
    </>
  )
} 