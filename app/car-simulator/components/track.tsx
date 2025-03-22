"use client"

import { useMemo } from "react"
import { Vector3 } from "three"

export default function Track() {
  // Create track layout
  // This is a simplified oval track made of road segments
  const trackLayout = useMemo(() => {
    const segments = []

    // Straight section 1
    for (let i = 0; i < 5; i++) {
      segments.push({
        position: [0, 0, -i * 10 - 10],
        rotation: [0, 0, 0],
      })
    }

    // Curve 1
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 6
      segments.push({
        position: [Math.sin(angle) * 30, 0, -50 - Math.cos(angle) * 30],
        rotation: [0, angle, 0],
      })
    }

    // Straight section 2
    for (let i = 0; i < 5; i++) {
      segments.push({
        position: [30, 0, -i * 10 - 10],
        rotation: [0, Math.PI / 2, 0],
      })
    }

    // Curve 2
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 6 + Math.PI / 2
      segments.push({
        position: [30 + Math.sin(angle) * 30, 0, Math.cos(angle) * 30],
        rotation: [0, angle, 0],
      })
    }

    // Straight section 3
    for (let i = 0; i < 5; i++) {
      segments.push({
        position: [0, 0, i * 10 + 10],
        rotation: [0, Math.PI, 0],
      })
    }

    // Curve 3
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 6 + Math.PI
      segments.push({
        position: [Math.sin(angle) * 30, 0, 50 + Math.cos(angle) * 30],
        rotation: [0, angle, 0],
      })
    }

    // Straight section 4
    for (let i = 0; i < 5; i++) {
      segments.push({
        position: [-30, 0, i * 10 + 10],
        rotation: [0, -Math.PI / 2, 0],
      })
    }

    // Curve 4
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 6 - Math.PI / 2
      segments.push({
        position: [-30 + Math.sin(angle) * 30, 0, Math.cos(angle) * 30],
        rotation: [0, angle, 0],
      })
    }

    return segments
  }, [])

  // Create track walls (invisible barriers)
  const createTrackWalls = () => {
    const walls = []

    // Outer walls
    for (let i = 0; i < trackLayout.length; i++) {
      const segment = trackLayout[i]
      const nextSegment = trackLayout[(i + 1) % trackLayout.length]

      // Create wall between this segment and the next
      const wallPos = new Vector3(
        (segment.position[0] + nextSegment.position[0]) / 2,
        1,
        (segment.position[2] + nextSegment.position[2]) / 2,
      )

      // Calculate wall dimensions and rotation
      const dx = nextSegment.position[0] - segment.position[0]
      const dz = nextSegment.position[2] - segment.position[2]
      const length = Math.sqrt(dx * dx + dz * dz)
      const angle = Math.atan2(dz, dx)

      walls.push({
        position: [wallPos.x, wallPos.y, wallPos.z],
        rotation: [0, angle + Math.PI / 2, 0],
        size: [1, 2, length],
      })
    }

    return walls
  }

  const trackWalls = useMemo(() => createTrackWalls(), [trackLayout])

  return (
    <group>
      {/* Track segments - visible colored planes to represent the track */}
      {trackLayout.map((segment, index) => (
        <group key={`segment-${index}`} position={segment.position} rotation={segment.rotation}>
          {/* Road surface */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
            <planeGeometry args={[8, 8]} />
            <meshStandardMaterial color="#444444" />
          </mesh>

          {/* Road edges */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
            <ringGeometry args={[3.8, 4, 32]} />
            <meshStandardMaterial color="white" />
          </mesh>
        </group>
      ))}

      {/* Track walls - now visible for better orientation */}
      {trackWalls.map((wall, index) => (
        <mesh key={`wall-${index}`} position={wall.position} rotation={wall.rotation}>
          <boxGeometry args={wall.size} />
          <meshStandardMaterial color="#ff0000" opacity={0.3} transparent />
        </mesh>
      ))}

      {/* Start/Finish line */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[10, 2]} />
        <meshStandardMaterial color="white" />
      </mesh>
    </group>
  )
}

