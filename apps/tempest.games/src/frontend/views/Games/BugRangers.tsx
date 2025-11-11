import { animated, useSpring } from "@react-spring/three"
import * as Drei from "@react-three/drei"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { atom, getState, setState } from "atom.io"
import { useAtomicRef, useI, useO } from "atom.io/react"
import type { ReactNode } from "react"
import { useRef } from "react"
import * as THREE from "three"
import type * as STD from "three-stdlib"

import { HexGridHelper } from "./HexGridHelper"
import { GameTiles, PlayableZones } from "./HexTile"

const controlsEnabledAtom = atom<boolean>({
	key: `controlsEnabled`,
	default: true,
})

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
	console.log(`controlsEnabled`, controlsEnabled)

	return (
		<Drei.OrbitControls
			ref={controls}
			enableDamping
			dampingFactor={0.05}
			enabled={controlsEnabled}
		/>
	)
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

			<CameraAnchoredSphere />
		</Canvas>
	)
}

type ProbeState = `dragging` | `idle` | `returning`

const probeStateAtom = atom<ProbeState>({
	key: `probeState`,
	default: `idle`,
})

const cameraAnchoredSphereAtom = atom<THREE.Mesh | null>({
	key: `cameraAnchoredSphere`,
	default: null,
})

const forward = new THREE.Vector3()
const right = new THREE.Vector3()
const upWorld = new THREE.Vector3(0, 1, 0)
const upCam = new THREE.Vector3()
const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)

const distForward = 10
const offsetRight = -2
const offsetUp = 1
const hitPoint = new THREE.Vector3()

function CameraAnchoredSphere() {
	// const ref = useRef<THREE.Mesh>(null!)
	const ref = useAtomicRef(cameraAnchoredSphereAtom, useRef)
	const { camera, raycaster, pointer } = useThree()
	const setControlsEnabled = useI(controlsEnabledAtom)

	const startDrag = () => {
		setControlsEnabled(false)
		setState(probeStateAtom, `dragging`)
	}

	const endDrag = () => {
		setControlsEnabled(true)
		setState(probeStateAtom, `returning`)
	}

	useFrame(() => {
		if (!ref.current) return
		const probeState = getState(probeStateAtom)

		switch (probeState) {
			case `idle`:
			case `returning`:
				// Forward vector
				camera.getWorldDirection(forward) // normalized

				// Right vector (forward × worldUp)
				right.copy(forward).cross(upWorld).normalize()

				// Camera-up vector (right × forward)
				upCam.copy(right).cross(forward).normalize()

				// Move the sphere
				ref.current.position.copy(
					camera.position
						.clone()
						.add(forward.multiplyScalar(distForward))
						.add(right.multiplyScalar(offsetRight))
						.add(upCam.multiplyScalar(-offsetUp)),
				)
				break
			case `dragging`:
				raycaster.setFromCamera(pointer, camera)
				if (raycaster.ray.intersectPlane(plane, hitPoint)) {
					ref.current.position.copy(hitPoint.clone())
				}
		}
	})

	return (
		<mesh onPointerDown={startDrag} onPointerUp={endDrag} ref={ref}>
			<sphereGeometry args={[1, 32, 32]} />
			<meshToonMaterial color="red" />
		</mesh>
	)
}
