import { useSpring } from "@react-spring/three"
import * as Drei from "@react-three/drei"
import { Canvas } from "@react-three/fiber"
import { useO } from "atom.io/react"
import type { ReactNode } from "react"
import { useRef } from "react"
import * as THREE from "three"
import type * as STD from "three-stdlib"

import { turnInProgressAtom } from "../../../../library/bug-rangers-game-state"
import {
	cameraTargetAtom,
	controlsEnabledAtom,
} from "../BugRangers/bug-rangers-client-state"
import { HexGridHelper } from "../BugRangers/HexGridHelper"
import { PlayerTools } from "../BugRangers/PlayerTools"
import { GameTiles, PlayableZones } from "../BugRangers/TilesAndZones"

export function BugRangers3D(): ReactNode {
	const cameraTarget = useO(cameraTargetAtom)
	useSpring({
		animatedCam: cameraTarget,
		config: { mass: 1, tension: 170, friction: 26 },
	})
	const turnInProgress = useO(turnInProgressAtom)

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

			<CameraController target={[...cameraTarget]} />

			<HexGridHelper size={20} radius={1} color="#6f6f6f" opacity={0.5} />

			<GameTiles />
			{turnInProgress === null ? <PlayableZones /> : null}

			<PlayerTools />
		</Canvas>
	)
}

function CameraController({ target }: { target: number[] }) {
	const controls = useRef<STD.OrbitControls>(null)
	const controlsEnabled = useO(controlsEnabledAtom)

	useSpring({
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

	return (
		<Drei.OrbitControls
			ref={controls}
			enableDamping
			dampingFactor={0.05}
			enabled={controlsEnabled}
		/>
	)
}
