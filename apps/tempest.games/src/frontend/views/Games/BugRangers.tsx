import { useSpring } from "@react-spring/three"
import * as Drei from "@react-three/drei"
import { Canvas, useThree } from "@react-three/fiber"
import { atom } from "atom.io"
import { useI, useO } from "atom.io/react"
import type { ReactNode } from "react"
import { useRef } from "react"
import * as THREE from "three"
import type * as STD from "three-stdlib"

import { HexGridHelper } from "./HexGridHelper"
import { GameTiles, PlayableZones } from "./HexTile"

function CameraController({ target }: { target: number[] }) {
	const controls = useRef<STD.OrbitControls>(null)
	const { camera } = useThree()

	const { animatedTarget } = useSpring({
		animatedTarget: target,
		config: { mass: 1, tension: 170, friction: 26 },
		onChange: ({ value }) => {
			controls.current?.target.lerp(
				new THREE.Vector3(...value[`animatedTarget`]),
				0.2,
			)
			controls.current?.update()
		},
	})

	return <Drei.OrbitControls ref={controls} enableDamping dampingFactor={0.05} />
}

export const cameraTargetAtom = atom<[x: number, y: number, z: number]>({
	key: `cameraTarget`,
	default: [0, 0, 0],
})

export default function Scene(): ReactNode {
	const cameraTarget = useO(cameraTargetAtom)
	const setCameraTarget = useI(cameraTargetAtom)
	const { animatedCam } = useSpring({
		animatedCam: cameraTarget,
		config: { mass: 1, tension: 170, friction: 26 },
	})

	const handleObjectClick = (pos: [x: number, y: number, z: number]) => {
		setCameraTarget(pos)
	}

	return (
		<Canvas
			camera={{ position: [15, 15, 15], fov: 50 }}
			style={{
				position: `fixed`,
				top: 0,
				left: 0,
				width: `100vw`,
				height: `100vh`,
			}}
		>
			<ambientLight intensity={0.5} />
			<directionalLight position={[5, 10, 5]} />

			<CameraController target={cameraTarget} />

			<HexGridHelper size={20} radius={1} color="#6f6f6f" opacity={0.5} />

			<GameTiles />
			<PlayableZones />
			{/* <GameTile coordinatesSerialized={`1_0_-1`} color={`purple`} />
			<GameTile coordinatesSerialized={`-1_0_1`} color={`blue`} />
			<GameTile coordinatesSerialized={`1_-1_0`} color={`green`} />
			<GameTile coordinatesSerialized={`-1_1_0`} color={`red`} />
			<GameTile coordinatesSerialized={`-2_1_1`} color={`magenta`} />
			<GameTile coordinatesSerialized={`2_-1_-1`} color={`cyan`} /> */}
		</Canvas>
	)
}
