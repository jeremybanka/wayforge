import { animated, useSpring } from "@react-spring/three"
import * as Drei from "@react-three/drei"
import { Canvas, ThreeEvent, useFrame, useThree } from "@react-three/fiber"
import { atom } from "atom.io"
import { useI, useO } from "atom.io/react"
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

function DraggableProbe() {
	const mesh = useRef<THREE.Mesh>(null)
	const { camera, scene, raycaster } = useThree()
	const pointer = new THREE.Vector2()
	const setDragging = useI(isDraggingAtom)
	const dragging = useO(isDraggingAtom)

	const onPointerDown = (e: PointerEvent) => {
		if (e.buttons !== 1) return
		setDragging(true)
		e.stopPropagation()
	}

	const onPointerUp = (e: PointerEvent) => {
		if (e.buttons !== 1) return
		setDragging(false)
		e.stopPropagation()
	}

	const onPointerMove = (e: PointerEvent) => {
		if (!dragging) return
		if (e.buttons !== 1) return // only while dragging

		// convert screen pointer -> NDC → raycast
		pointer.x = (e.clientX / window.innerWidth) * 2 - 1
		pointer.y = -(e.clientY / window.innerHeight) * 2 + 1

		raycaster.setFromCamera(pointer, camera)

		// intersect with a ground plane (y = 0), or any custom plane
		const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
		const point = new THREE.Vector3()
		raycaster.ray.intersectPlane(plane, point)

		mesh.current?.position.copy(point)
	}

	return (
		<mesh
			ref={mesh}
			position={[-0.5, -0.5, -2]} // 2 units in front of camera
			onPointerDown={onPointerDown}
			onPointerUp={onPointerUp}
			onPointerMove={onPointerMove}
		>
			<sphereGeometry args={[0.15, 32, 32]} />
			<meshStandardMaterial color="orange" />
		</mesh>
	)
}

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
function Probe({ destination }: { destination: THREE.Vector3 }) {
	const { pos } = useSpring({
		pos: destination.toArray(),
		config: { tension: 120, friction: 14, mass: 0.3 },
	})

	return (
		<animated.mesh position={pos}>
			<sphereGeometry args={[0.15, 32, 32]} />
			<meshStandardMaterial color="orange" />
		</animated.mesh>
	)
}
function ProbeController() {
	const [isDragging, setDragging] = useState(false)
	const destination = useProbeDestination(isDragging)
	const setControlsEnabled = useI(controlsEnabledAtom)

	const handlePointerDown = () => {
		console.log(`handlePointerDown`)
		setControlsEnabled(false)
		setDragging(true)
	}
	const handlePointerUp = () => {
		setControlsEnabled(true)
		setDragging(false)
	}

	return (
		<group>
			<Probe destination={destination} />

			{/* Click-catcher for drag initiation */}
			<mesh
				position={[0, 0, 0]}
				onPointerDown={handlePointerDown}
				onPointerUp={handlePointerUp}
				// onPointerLeave={handlePointerUp}
			>
				<sphereGeometry args={[0.25]} />
				<meshBasicMaterial transparent opacity={0} />
			</mesh>
		</group>
	)
}
