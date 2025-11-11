import { animated, useSpring } from "@react-spring/three"
import * as Drei from "@react-three/drei"
import { Canvas, ThreeEvent, useFrame, useThree } from "@react-three/fiber"
import { atom, setState } from "atom.io"
import { useAtomicRef, useI, useO } from "atom.io/react"
import type { ReactNode } from "react"
import { useEffect, useRef, useState } from "react"
import * as THREE from "three"
import type * as STD from "three-stdlib"

import { HexGridHelper } from "./HexGridHelper"
import { GameTiles, PlayableZones } from "./HexTile"

export const controlsEnabledAtom = atom<boolean>({
	key: `controlsEnabled`,
	default: true,
})

// function CameraController({ target }: { target: number[] }) {
// 	const controls = useRef<STD.OrbitControls>(null)
// 	const { camera } = useThree()

// 	const { animatedTarget } = useSpring({
// 		animatedTarget: target,
// 		config: { mass: 1, tension: 170, friction: 26 },
// 		onChange: ({ value }) => {
// 			controls.current?.target.lerp(
// 				new THREE.Vector3(...value[`animatedTarget`]),
// 				0.2,
// 			)
// 			controls.current?.update()
// 		},
// 	})

// 	return <Drei.OrbitControls ref={controls} enableDamping dampingFactor={0.05} />
// }

function CameraController({ target }: { target: number[] }) {
	const controls = useRef<STD.OrbitControls>(null)
	const { camera } = useThree()
	const controlsEnabled = useO(controlsEnabledAtom)

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
			{/* <GameTile coordinatesSerialized={`1_0_-1`} color={`purple`} />
			<GameTile coordinatesSerialized={`-1_0_1`} color={`blue`} />
			<GameTile coordinatesSerialized={`1_-1_0`} color={`green`} />
			<GameTile coordinatesSerialized={`-1_1_0`} color={`red`} />
			<GameTile coordinatesSerialized={`-2_1_1`} color={`magenta`} />
			<GameTile coordinatesSerialized={`2_-1_-1`} color={`cyan`} /> */}
			{/* <CameraAttachment>
				<DraggableProbe />
			</CameraAttachment> */}
			<ProbeController />
			<CameraAnchoredSphere />
		</Canvas>
	)
}

function CameraAttachment({ children }: { children: ReactNode }) {
	const { camera } = useThree()
	const group = useRef<THREE.Group>(null)

	useFrame(() => {
		if (group.current) {
			// follow camera
			group.current.position.copy(camera.position)
			group.current.quaternion.copy(camera.quaternion)
		}
	})

	return <group ref={group}>{children}</group>
}

const isDraggingAtom = atom<boolean>({
	key: `isDragging`,
	default: false,
})

function useProbeDestination(isDragging: boolean) {
	const { camera, raycaster } = useThree()
	const pointer = useRef(new THREE.Vector2()).current
	const [destination, setDestination] = useState(() => new THREE.Vector3())

	useFrame(({ mouse }) => {
		if (isDragging) {
			// Update pointer (NDC)
			pointer.x = mouse.x
			pointer.y = mouse.y

			raycaster.setFromCamera(pointer, camera)

			const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
			const hit = new THREE.Vector3()

			if (raycaster.ray.intersectPlane(plane, hit)) {
				setDestination(hit.clone())
			}
		} else {
			// Idle: position some distance in front of camera
			const idlePoint = new THREE.Vector3(0, 0, -2)
				.applyQuaternion(camera.quaternion)
				.add(camera.position)

			setDestination(idlePoint)
		}
	})

	return destination
}

const probeTargetPositionAtom = atom<THREE.Vector3>({
	key: `probeTargetPosition`,
	default: new THREE.Vector3(),
})

function Probe() {
	const state = useO(probeStateAtom)
	const shouldSpring = state !== `idle`
	const { camera, raycaster, pointer } = useThree()
	const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
	const hitPoint = new THREE.Vector3()
	const target = useO(probeTargetPositionAtom)
	const setTarget = useI(probeTargetPositionAtom)

	useFrame(() => {
		switch (state) {
			case `dragging`:
				raycaster.setFromCamera(pointer, camera)
				if (raycaster.ray.intersectPlane(plane, hitPoint)) {
					setTarget(hitPoint.clone())
					setTarget((pos: THREE.Vector3) => pos.copy(hitPoint))
				}
				return
			case `idle`:
			case `returning`:
				{
					// same idle point, but spring will be applied externally
					const idlePoint = new THREE.Vector3(-1, 0, -10)
						.applyQuaternion(camera.quaternion)
						.add(camera.position)
					setTarget(idlePoint)
					// setTarget((pos: THREE.Vector3) =>
					// 	pos
					// 		.set(-1, 0, -10)
					// 		.applyQuaternion(camera.quaternion)
					// 		.add(camera.position),
					// )
				}
				return
		}
	})

	console.count(state)

	const { pos } = useSpring({
		pos: target.toArray(),
		immediate: !shouldSpring, // ✅ idle = NO SPRING
		config: { tension: 130, friction: 16, mass: 0.4 },
		// onRest: () => {
		// 	console.count(`onRest`)
		// 	if (state === `returning`) {
		// 		// transition to full idle lock-in
		// 		setState(probeStateAtom, `idle`)
		// 	}
		// },
	})

	return (
		<animated.mesh position={state === `idle` ? target : pos}>
			<animated.sphereGeometry args={[0.2, 32, 32]} />
			<animated.meshStandardMaterial color="orange" />
		</animated.mesh>
	)
}
function ProbeController() {
	const setControlsEnabled = useI(controlsEnabledAtom)

	const startDrag = () => {
		setControlsEnabled(false)
		setState(probeStateAtom, `dragging`)
	}

	const endDrag = () => {
		setControlsEnabled(true)
		setState(probeStateAtom, `returning`)
	}

	const target = useO(probeTargetPositionAtom)

	return (
		<group>
			<Probe />

			<mesh
				onPointerDown={startDrag}
				onPointerUp={endDrag}
				position={target}
				// onPointerLeave={endDrag}
			>
				<sphereGeometry args={[0.2, 32, 32]} />
				<meshBasicMaterial color="orange" />
			</mesh>
		</group>
	)
}

type ProbeState = `dragging` | `idle` | `returning`

export const probeStateAtom = atom<ProbeState>({
	key: `probeState`,
	default: `idle`,
})

const cameraAnchoredSphereAtom = atom<THREE.Mesh | null>({
	key: `cameraAnchoredSphere`,
	default: null,
})

function CameraAnchoredSphere() {
	// const ref = useRef<THREE.Mesh>(null!)
	const ref = useAtomicRef(cameraAnchoredSphereAtom, useRef)
	const { camera } = useThree()
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
		// Position relative to camera (in camera space)
		ref.current?.position.set(0.3, -0.3, -1.2) // right, down, forward from camera
		ref.current?.quaternion.copy(camera.quaternion)
	})

	return (
		<mesh
			onPointerDown={startDrag}
			onPointerUp={endDrag}
			ref={ref}
			// onPointerLeave={endDrag}
		>
			<sphereGeometry args={[0.2, 32, 32]} />
			<meshBasicMaterial color="red" />
		</mesh>
	)
}
