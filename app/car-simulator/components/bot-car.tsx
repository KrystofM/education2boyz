"use client"

import { useRef, useState, useEffect } from "react"
import { useFrame } from "@react-three/fiber"
import { useBox } from "@react-three/cannon"
import { Vector3, Euler } from "three"

export default function BotCar({ position, color, raceStarted, difficulty = 0.8 }) {
  const carRef = useRef()

  const [carPhysicsRef, carApi] = useBox(() => ({
    mass: 500,
    position: [position.x, 1, position.z], // Start slightly above ground
    args: [1.8, 1, 4], // Car collision box size
    allowSleep: false,
    linearDamping: 0.5,
    angularDamping: 0.5,
  }))

  // Bot car state
  const [velocity, setVelocity] = useState([0, 0, 0])
  const [lapProgress, setLapProgress] = useState(0)
  const [lap, setLap] = useState(0)

  // Bot car parameters
  const maxSpeed = 25 * difficulty
  const acceleration = 150 * difficulty
  const turnSpeed = 0.02 * difficulty

  // Waypoints for the bot to follow (simplified - would be more complex in a real implementation)
  // These would be generated based on the actual track
  const waypoints = [
    new Vector3(0, 0, -20),
    new Vector3(20, 0, -40),
    new Vector3(40, 0, -20),
    new Vector3(40, 0, 20),
    new Vector3(20, 0, 40),
    new Vector3(0, 0, 20),
    new Vector3(-20, 0, 40),
    new Vector3(-40, 0, 20),
    new Vector3(-40, 0, -20),
    new Vector3(-20, 0, -40),
  ]

  const [currentWaypoint, setCurrentWaypoint] = useState(0)

  // Get velocity from physics
  useEffect(() => {
    const unsubscribe = carApi.velocity.subscribe((v) => setVelocity(v))
    return unsubscribe
  }, [carApi])

  // Bot AI logic
  useFrame((state, delta) => {
    if (!carPhysicsRef.current || !raceStarted) return

    // Get current position and rotation
    const position = carPhysicsRef.current.position
    const rotation = carPhysicsRef.current.rotation

    // Calculate direction to current waypoint
    const targetWaypoint = waypoints[currentWaypoint]
    const dirToWaypoint = new Vector3(targetWaypoint.x - position.x, 0, targetWaypoint.z - position.z).normalize()

    // Calculate forward direction based on car's rotation
    const forwardDir = new Vector3(0, 0, -1)
    forwardDir.applyEuler(new Euler(rotation.x, rotation.y, rotation.z))
    forwardDir.normalize()

    // Calculate angle between forward and target direction
    const dot = forwardDir.dot(dirToWaypoint)
    const cross = forwardDir.cross(dirToWaypoint)

    // Determine if we need to turn left or right
    const turnDirection = Math.sign(cross.y)

    // Apply turning force if needed
    if (Math.abs(dot) < 0.95) {
      carApi.angularVelocity.set(0, turnSpeed * turnDirection, 0)
    }

    // Apply forward force
    const currentSpeed = new Vector3(velocity[0], velocity[1], velocity[2]).length()

    if (currentSpeed < maxSpeed) {
      const force = forwardDir.clone().multiplyScalar(acceleration * delta)
      carApi.applyLocalForce(force.toArray(), [0, 0, 0])
    }

    // Check if we've reached the waypoint
    const distToWaypoint = new Vector3(position.x - targetWaypoint.x, 0, position.z - targetWaypoint.z).length()

    if (distToWaypoint < 10) {
      setCurrentWaypoint((prev) => (prev + 1) % waypoints.length)

      // If we've completed a circuit of waypoints, increment lap
      if (currentWaypoint === 0) {
        setLap((prev) => prev + 1)
      }
    }

    // Update car model position and rotation to match physics
    if (carRef.current) {
      carRef.current.position.copy(carPhysicsRef.current.position)
      carRef.current.rotation.copy(carPhysicsRef.current.rotation)
    }
  })

  return (
    <group>
      {/* Physics body (invisible) */}
      <mesh ref={carPhysicsRef} visible={false}>
        <boxGeometry args={[1.8, 1, 4]} />
        <meshStandardMaterial color={color} wireframe />
      </mesh>

      {/* Car model made of basic shapes */}
      <group ref={carRef}>
        {/* Car body */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[1.5, 0.8, 3]} />
          <meshStandardMaterial color={color} />
        </mesh>
        {/* Car cabin */}
        <mesh position={[0, 0.6, -0.5]}>
          <boxGeometry args={[1.2, 0.6, 1.5]} />
          <meshStandardMaterial color={color} />
        </mesh>
        {/* Front window */}
        <mesh position={[0, 0.6, -1.4]} rotation={[Math.PI / 4, 0, 0]}>
          <boxGeometry args={[1.1, 0.1, 0.8]} />
          <meshStandardMaterial color="#88ccff" />
        </mesh>
        {/* Wheels */}
        <mesh position={[0.8, -0.4, 1]}>
          <cylinderGeometry args={[0.4, 0.4, 0.3, 16]} />
          <meshStandardMaterial color="black" />
        </mesh>
        <mesh position={[-0.8, -0.4, 1]}>
          <cylinderGeometry args={[0.4, 0.4, 0.3, 16]} />
          <meshStandardMaterial color="black" />
        </mesh>
        <mesh position={[0.8, -0.4, -1]}>
          <cylinderGeometry args={[0.4, 0.4, 0.3, 16]} />
          <meshStandardMaterial color="black" />
        </mesh>
        <mesh position={[-0.8, -0.4, -1]}>
          <cylinderGeometry args={[0.4, 0.4, 0.3, 16]} />
          <meshStandardMaterial color="black" />
        </mesh>
        {/* Headlights */}
        <mesh position={[0.5, 0, 1.5]}>
          <boxGeometry args={[0.3, 0.3, 0.1]} />
          <meshStandardMaterial color="white" emissive="white" emissiveIntensity={0.5} />
        </mesh>
        <mesh position={[-0.5, 0, 1.5]}>
          <boxGeometry args={[0.3, 0.3, 0.1]} />
          <meshStandardMaterial color="white" emissive="white" emissiveIntensity={0.5} />
        </mesh>
      </group>
    </group>
  )
}

