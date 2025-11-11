import { useFrame, useThree } from "@react-three/fiber"
import { getState, setState } from "atom.io"
import { useAtomicRef, useI } from "atom.io/react"
import type { ReactNode } from "react"
import { useRef } from "react"
import * as THREE from "three"

import { HexTile } from "./HexTile"
import type { TileCubeCount } from "./store"
import {
	cameraAnchoredSphereAtom,
	closestPlayableZoneSelector,
	controlsEnabledAtom,
	dragpointAtom,
	dragStateAtom,
	gameTilesAtom,
	gameTilesStackHeightAtoms,
	tileCubeCountAtoms,
	turnInProgressAtom,
} from "./store"

export function PlayerTools(): ReactNode {
	return (
		<>
			<PlayableHex />
			<PlayableCube />
		</>
	)
}

const forward = new THREE.Vector3()
const right = new THREE.Vector3()
const upWorld = new THREE.Vector3(0, 1, 0)
const upCam = new THREE.Vector3()
const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)

const distForward = 10
const offsetRight = -2
const offsetUp = 1
const hitPoint = new THREE.Vector3()

function PlayableHex(): ReactNode {
	const ref = useAtomicRef(cameraAnchoredSphereAtom, useRef)
	const { camera, raycaster, pointer } = useThree()
	const setControlsEnabled = useI(controlsEnabledAtom)

	const startDrag = () => {
		setControlsEnabled(false)
		setState(dragStateAtom, `tile`)
	}

	const endDrag = () => {
		setControlsEnabled(true)
		setState(dragStateAtom, null)
		const turnInProgress = getState(turnInProgressAtom)
		switch (turnInProgress?.type) {
			case null:
			case undefined:
				{
					const closestPlayableZone = getState(closestPlayableZoneSelector)
					if (closestPlayableZone) {
						setState(gameTilesAtom, (permanent) => {
							permanent.add(closestPlayableZone)
							return permanent
						})
						setState(turnInProgressAtom, {
							type: `build`,
							target: closestPlayableZone,
							count: 1,
						})
					}
				}
				break
			case `build`:
				{
					setState(
						gameTilesStackHeightAtoms,
						turnInProgress.target,
						(stackHeight) => {
							switch (stackHeight) {
								case 1:
									return 2
								case 2:
								case 3:
									return 3
							}
						},
					)
				}
				break
			case `arm`:
		}
		setState(dragpointAtom, null)
	}

	useFrame(() => {
		if (!ref.current) return
		const dragState = getState(dragStateAtom)

		switch (dragState) {
			case `tile`:
				raycaster.setFromCamera(pointer, camera)
				if (raycaster.ray.intersectPlane(plane, hitPoint)) {
					setState(dragpointAtom, hitPoint)
					ref.current.position.copy(hitPoint)
				}
				break
			case null:
			case `cube`:
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
		}
	})

	return <HexTile ref={ref} onPointerDown={startDrag} onPointerUp={endDrag} />
}

function PlayableCube(): ReactNode {
	const ref = useAtomicRef(cameraAnchoredSphereAtom, useRef)
	const { camera, raycaster, pointer } = useThree()
	const setControlsEnabled = useI(controlsEnabledAtom)

	const startDrag = () => {
		setControlsEnabled(false)
		setState(dragStateAtom, `cube`)
	}

	const endDrag = () => {
		setControlsEnabled(true)
		setState(dragStateAtom, null)
		const closestPlayableZone = getState(closestPlayableZoneSelector)
		setState(dragpointAtom, null)
		if (closestPlayableZone) {
			setState(
				tileCubeCountAtoms,
				closestPlayableZone,
				(current) => (current + 1) as TileCubeCount,
			)
		}
	}

	useFrame(() => {
		if (!ref.current) return
		const dragState = getState(dragStateAtom)

		switch (dragState) {
			case `cube`:
				raycaster.setFromCamera(pointer, camera)
				if (raycaster.ray.intersectPlane(plane, hitPoint)) {
					setState(dragpointAtom, hitPoint)
					ref.current.position.copy(hitPoint)
				}
				break
			case null:
			case `tile`:
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
						.add(right.multiplyScalar(-offsetRight))
						.add(upCam.multiplyScalar(-offsetUp)),
				)
		}
	})

	return (
		<mesh ref={ref} onPointerDown={startDrag} onPointerUp={endDrag}>
			<boxGeometry args={[0.5, 0.5, 0.5]} />
			<meshStandardMaterial color="hotpink" />
		</mesh>
	)
}
