import { useSpring } from "@react-spring/three"
import * as Drei from "@react-three/drei"
import { Canvas } from "@react-three/fiber"
import { useO } from "atom.io/react"
import type { UserKey } from "atom.io/realtime"
import { myRoomKeySelector, myUserKeyAtom } from "atom.io/realtime-client"
import {
	usePullAtom,
	usePullAtomFamilyMember,
	usePullSelector,
} from "atom.io/realtime-react"
import type { ReactNode } from "react"
import { useRef } from "react"
import * as THREE from "three"
import type * as STD from "three-stdlib"

import {
	playerColorAtoms,
	turnInProgressAtom,
	validWarDeclaratorsSelector,
	validWarTargetsSelector,
} from "../../../../library/bug-rangers-game-state"
import {
	cameraTargetAtom,
	controlsEnabledAtom,
	isMyTurnSelector,
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
			<BugRangersExterior3D />
		</Canvas>
	)
}

export function BugRangersExterior3D(): ReactNode {
	const myRoomKey = useO(myRoomKeySelector)
	const myUserKey = usePullAtom(myUserKeyAtom)
	return myUserKey && myRoomKey ? (
		<BugRangersInterior3D myUserKey={myUserKey} />
	) : null
}
export function BugRangersInterior3D({
	myUserKey,
}: {
	myUserKey: UserKey
}): ReactNode {
	const turnInProgress = usePullAtom(turnInProgressAtom)
	const isMyTurn = usePullSelector(isMyTurnSelector)
	const myColor = usePullAtomFamilyMember(playerColorAtoms, myUserKey)
	const validWarDeclarators = usePullSelector(validWarDeclaratorsSelector)
	const validWarTargets = usePullSelector(validWarTargetsSelector)

	return (
		<>
			<GameTiles
				validWarDeclarators={validWarDeclarators}
				validWarTargets={validWarTargets}
			/>

			{myColor &&
			turnInProgress === null &&
			isMyTurn &&
			validWarDeclarators.length === 0 ? (
				<PlayableZones />
			) : null}

			{myColor && isMyTurn && validWarDeclarators.length === 0 ? (
				<PlayerTools />
			) : null}
		</>
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
