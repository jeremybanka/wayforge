/** biome-ignore-all lint/a11y/noStaticElementInteractions: drei */

import { useSpring } from "@react-spring/three"
import * as Drei from "@react-three/drei"
import { Canvas, useThree } from "@react-three/fiber"
import type { ReactNode } from "react"
import { useRef, useState } from "react"
import * as THREE from "three"
import type * as STD from "three-stdlib"

import { HexGridHelper } from "./HexGridHelper"
import { GameTile, HexTile } from "./HexTile"

function CameraController({ target }: { target: number[] }) {
	const controls = useRef<STD.OrbitControls>(null)
	const { camera } = useThree()

	// Smoothly animate camera target and position
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

function SelectableObject({
	position,
	color,
	onClick,
}: {
	position: [x: number, y: number, z: number]
	color: string
	onClick: (pos: number[]) => void
}) {
	return (
		<mesh
			position={position}
			onClick={() => {
				onClick(position)
			}}
		>
			<boxGeometry args={[1, 1, 1]} />
			<meshStandardMaterial color={color} />
		</mesh>
	)
}

export default function Scene(): ReactNode {
	const [target, setTarget] = useState<[x: number, y: number, z: number]>([
		0, 0, 0,
	])
	const { animatedCam } = useSpring({
		animatedCam: target,
		config: { mass: 1, tension: 170, friction: 26 },
	})

	const handleObjectClick = (pos: [x: number, y: number, z: number]) => {
		setTarget(pos)
	}

	return (
		<Canvas
			camera={{ position: [5, 5, 5], fov: 50 }}
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

			<CameraController target={target} />

			{/* <SelectableObject
				position={[0, 0, 0]}
				color="red"
				onClick={handleObjectClick}
			/> */}
			<SelectableObject
				position={[5, 0, 0]}
				color="blue"
				onClick={handleObjectClick}
			/>
			<SelectableObject
				position={[0, 0, 5]}
				color="green"
				onClick={handleObjectClick}
			/>

			<HexGridHelper size={20} radius={1} color="#6f6f6f" opacity={0.5} />
			{/* <gridHelper args={[20, 20]} /> */}
			<axesHelper args={[5]} />

			<GameTile coordinates={{ x: 0, y: 0, z: 0 }} stackHeight={3} />
			<GameTile coordinates={{ x: 1, y: 0, z: 0 }} color="red" />
			<GameTile coordinates={{ x: 1, y: 0, z: 1 }} color="blue" />
			<GameTile
				coordinates={{ x: 1, y: -1, z: 0 }}
				color="green"
				stackHeight={2}
			/>
			{/* <GameTile coordinates={{ x: -1, y: 2, z: -1 }} />
			<GameTile coordinates={{ x: 2, y: -1, z: -1 }} />
			<GameTile coordinates={{ x: -1, y: 1, z: 0 }} stackHeight={2} /> */}
		</Canvas>
	)
}
