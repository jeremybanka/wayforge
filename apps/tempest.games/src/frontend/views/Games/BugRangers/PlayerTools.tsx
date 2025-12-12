import { useFrame, useThree } from "@react-three/fiber"
import { getState, setState } from "atom.io"
import { useAtomicRef, useI, useO } from "atom.io/react"
import { myUserKeyAtom } from "atom.io/realtime-client"
import type { ReactNode } from "react"
import { useRef } from "react"
import * as THREE from "three"

import type {
	StackHeight,
	TileCubeCount,
} from "../../../../library/bug-rangers-game-state"
import {
	closestOwnedTileSelector,
	closestPlayableZoneSelector,
	dragpointAtom,
	dragStateAtom,
	gameTilesAtom,
	gameTilesStackHeightAtoms,
	maximumStackHeightSelectors,
	tileCubeCountAtoms,
	tileOwnerAtoms,
	turnInProgressAtom,
} from "../../../../library/bug-rangers-game-state"
import {
	cameraAnchoredSphereAtom,
	controlsEnabledAtom,
} from "./bug-rangers-client-state"
import { CubeToken } from "./CubeToken"
import { HexTile } from "./HexTile"

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
	const dragState = useO(dragStateAtom)

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
					const userKey = getState(myUserKeyAtom)
					const maximumStackHeight = getState(
						maximumStackHeightSelectors,
						[turnInProgress.target, userKey!], // ❗ use real user key here
					)
					if (maximumStackHeight === 0) return
					const stackHeight = getState(
						gameTilesStackHeightAtoms,
						turnInProgress.target,
					)
					if (stackHeight >= maximumStackHeight) return
					setState(
						gameTilesStackHeightAtoms,
						turnInProgress.target,
						(stackHeight + 1) as StackHeight,
					)
				}
				break
			case `arm`:
		}
		setState(dragpointAtom, null)
	}

	useFrame(() => {
		if (!ref.current) return

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
	const dragState = useO(dragStateAtom)

	const startDrag = () => {
		setControlsEnabled(false)
		setState(dragStateAtom, `cube`)
	}

	const endDrag = () => {
		setControlsEnabled(true)
		setState(dragStateAtom, null)
		const turnInProgress = getState(turnInProgressAtom)
		const myUserKey = getState(myUserKeyAtom)

		switch (turnInProgress?.type) {
			case null:
			case undefined:
				{
					const closestOwnedTile = getState(closestOwnedTileSelector, myUserKey!) // ❗ use real user key here
					if (closestOwnedTile) {
						setState(turnInProgressAtom, {
							type: `arm`,
							targets: [closestOwnedTile],
						})
						setState(
							tileCubeCountAtoms,
							closestOwnedTile,
							(current) => (current + 1) as TileCubeCount,
						)
					}
				}
				break
			case `arm`:
				{
					if (turnInProgress.targets.length >= 2) return
					const closestOwnedTile = getState(closestOwnedTileSelector, myUserKey!) // ❗ use real user key here
					if (closestOwnedTile) {
						setState(turnInProgressAtom, {
							type: `arm`,
							targets: [turnInProgress.targets[0]!, closestOwnedTile],
						})
						setState(
							tileCubeCountAtoms,
							closestOwnedTile,
							(current) => (current + 1) as TileCubeCount,
						)
					}
				}
				break
			case `build`:
				setState(
					tileCubeCountAtoms,
					turnInProgress.target,
					(current) => (current + 1) as TileCubeCount,
				)
				setState(tileOwnerAtoms, turnInProgress.target, myUserKey)
				setState(turnInProgressAtom, null)
				break
		}
	}

	useFrame(() => {
		if (!ref.current) return

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

	return <CubeToken ref={ref} onPointerDown={startDrag} onPointerUp={endDrag} />
}
