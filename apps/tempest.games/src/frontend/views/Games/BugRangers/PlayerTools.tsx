import { useFrame, useThree } from "@react-three/fiber"
import { getState, setState } from "atom.io"
import { useAtomicRef, useI, useO } from "atom.io/react"
import type { UserKey } from "atom.io/realtime"
import { myUserKeyAtom } from "atom.io/realtime-client"
import { usePullAtom, usePullSelector } from "atom.io/realtime-react"
import type { ReactNode } from "react"
import { useRef } from "react"
import * as THREE from "three"

import type {
	TileCubeCount,
	TileStackHeight,
} from "../../../../library/bug-rangers-game-state"
import {
	closestOwnedTileSelector,
	closestPlayableZoneSelector,
	dragPointAtom,
	dragStateAtom,
	gameTilesAtom,
	gameTilesStackHeightAtoms,
	maximumStackHeightSelectors,
	playerColorAtoms,
	playerRemainingCubesAtoms,
	playerRemainingTilesAtoms,
	tileCubeCountAtoms,
	tileOwnerAtoms,
	turnInProgressAtom,
} from "../../../../library/bug-rangers-game-state"
import {
	cameraAnchoredSphereAtom,
	controlsEnabledAtom,
	mayPlaceCubeSelector,
	mayPlaceTileSelector,
	usePlayerActions,
} from "./bug-rangers-client-state"
import { CubeToken } from "./CubeToken"
import { HexTile } from "./HexTile"

export function PlayerTools(): ReactNode {
	const myUserKey = usePullAtom(myUserKeyAtom)
	const mayPlaceTile = usePullSelector(mayPlaceTileSelector)
	const mayPlaceCube = usePullSelector(mayPlaceCubeSelector)
	return myUserKey ? (
		<>
			{mayPlaceTile ? <PlayableTile myUserKey={myUserKey} /> : null}
			{mayPlaceCube ? <PlayableCube myUserKey={myUserKey} /> : null}
		</>
	) : null
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

function PlayableTile({ myUserKey }: { myUserKey: UserKey }): ReactNode {
	const ref = useAtomicRef(cameraAnchoredSphereAtom, useRef)
	const { camera, raycaster, pointer } = useThree()
	const setControlsEnabled = useI(controlsEnabledAtom)
	const dragState = useO(dragStateAtom)
	const socket = usePlayerActions()

	const startDrag = () => {
		setControlsEnabled(false)
		setState(dragStateAtom, `tile`)
	}

	const endDrag = () => {
		setControlsEnabled(true)
		setState(dragStateAtom, null)
		const turnInProgress = getState(turnInProgressAtom)
		switch (turnInProgress?.type) {
			case `arm`:
			case `war`:
			case `move`:
				break
			case null:
			case undefined:
				{
					const closestPlayableZone = getState(closestPlayableZoneSelector)
					if (closestPlayableZone) {
						setState(gameTilesAtom, (permanent) => {
							permanent.add(closestPlayableZone)
							return permanent
						})
						setState(
							playerRemainingTilesAtoms,
							myUserKey,
							(current) => current - 1,
						)
						setState(turnInProgressAtom, {
							type: `build`,
							target: closestPlayableZone,
							count: 1,
						})
						socket.emit(`placeTile`, closestPlayableZone)
					}
				}
				break
			case `build`:
				{
					const maximumStackHeight = getState(maximumStackHeightSelectors, [
						turnInProgress.target,
						myUserKey,
					])
					if (maximumStackHeight === 0) return
					const stackHeight = getState(
						gameTilesStackHeightAtoms,
						turnInProgress.target,
					)
					if (stackHeight >= maximumStackHeight) return
					setState(
						gameTilesStackHeightAtoms,
						turnInProgress.target,
						(stackHeight + 1) as TileStackHeight,
					)
					setState(
						playerRemainingTilesAtoms,
						myUserKey,
						(current) => current - 1,
					)
					setState(turnInProgressAtom, {
						type: `build`,
						target: turnInProgress.target,
						count: (turnInProgress.count + 1) as TileStackHeight,
					})
					socket.emit(`placeTile`, turnInProgress.target)
				}
				break
		}
		setState(dragPointAtom, null)
	}

	useFrame(() => {
		if (!ref.current) return

		switch (dragState) {
			case `tile`:
				raycaster.setFromCamera(pointer, camera)
				if (raycaster.ray.intersectPlane(plane, hitPoint)) {
					const slightlyAboveHitPoint = new THREE.Vector3(
						hitPoint.x,
						hitPoint.y + 0.001,
						hitPoint.z,
					)
					setState(dragPointAtom, slightlyAboveHitPoint)
					ref.current.position.copy(slightlyAboveHitPoint)
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

type PlayableCubeProps = {
	myUserKey: UserKey
}
function PlayableCube({ myUserKey }: PlayableCubeProps): ReactNode {
	const ref = useAtomicRef(cameraAnchoredSphereAtom, useRef)
	const { camera, raycaster, pointer } = useThree()
	const setControlsEnabled = useI(controlsEnabledAtom)
	const dragState = useO(dragStateAtom)
	const myColor = useO(playerColorAtoms, myUserKey)
	const socket = usePlayerActions()

	const startDrag = () => {
		setControlsEnabled(false)
		setState(dragStateAtom, `cube`)
	}

	const endDrag = () => {
		setControlsEnabled(true)
		setState(dragStateAtom, null)
		const turnInProgress = getState(turnInProgressAtom)

		switch (turnInProgress?.type) {
			case `move`:
			case `war`:
				break
			case null:
			case undefined:
				{
					const closestOwnedTile = getState(closestOwnedTileSelector, myUserKey)
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
						socket.emit(`placeCube`, closestOwnedTile)
					}
				}
				break
			case `arm`:
				{
					if (turnInProgress.targets.length >= 2) return
					const closestOwnedTile = getState(closestOwnedTileSelector, myUserKey)
					if (closestOwnedTile) {
						setState(
							tileCubeCountAtoms,
							closestOwnedTile,
							(current) => (current + 1) as TileCubeCount,
						)
						setState(
							playerRemainingCubesAtoms,
							myUserKey,
							(current) => current - 1,
						)
						setState(turnInProgressAtom, {
							type: `arm`,
							targets: [turnInProgress.targets[0], closestOwnedTile],
						})
						socket.emit(`placeCube`, closestOwnedTile)
					}
				}
				break
			case `build`:
				setState(
					tileCubeCountAtoms,
					turnInProgress.target,
					(current) => (current + 1) as TileCubeCount,
				)
				setState(playerRemainingCubesAtoms, myUserKey, (current) => current - 1)
				setState(tileOwnerAtoms, turnInProgress.target, myUserKey)
				setState(turnInProgressAtom, null)
				socket.emit(`placeCube`, turnInProgress.target)
				break
		}
	}

	useFrame(() => {
		if (!ref.current) return

		switch (dragState) {
			case `cube`:
				raycaster.setFromCamera(pointer, camera)
				if (raycaster.ray.intersectPlane(plane, hitPoint)) {
					setState(dragPointAtom, hitPoint)
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
		<CubeToken
			ref={ref}
			onPointerDown={startDrag}
			onPointerUp={endDrag}
			color={myColor ?? `#555`}
		/>
	)
}
