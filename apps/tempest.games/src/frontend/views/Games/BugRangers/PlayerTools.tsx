import type { UserKey } from "@atom.io/realtime"
import { myUserKeyAtom } from "@atom.io/realtime/client"
import type { Children } from "@atom.io/spa"
import { onCleanup, useGetter, useSetter } from "@atom.io/spa"
import { onSceneFrame } from "@atom.io/spa/renderer"
import { getState, setState } from "atom.io"
import * as THREE from "three"

import type {
	TileCubeCount,
	TileStackHeight,
} from "../../../../library/bug-rangers-game-state"
import {
	closestOwnedTileSelectors,
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
import { usePullAtom, usePullSelector } from "../../../services/realtime-hooks"
import {
	cameraAnchoredSphereAtom,
	controlsEnabledAtom,
	mayPlaceCubeSelector,
	mayPlaceTileSelector,
	usePlayerActions,
} from "./bug-rangers-client-state"
import { CubeToken } from "./CubeToken"
import { HexTile } from "./HexTile"
import {
	gameCamera as camera,
	gamePointer as pointer,
	gameRaycaster as raycaster,
} from "./scene-state"

export function PlayerTools(): Children {
	const myUserKey = usePullAtom(myUserKeyAtom)
	const mayPlaceTile = usePullSelector(mayPlaceTileSelector)
	const mayPlaceCube = usePullSelector(mayPlaceCubeSelector)
	return (
		<>
			{myUserKey() ? (
				<>
					{mayPlaceTile() ? <PlayableTile key={[`tile`, myUserKey()!]} /> : null}
					{mayPlaceCube() ? <PlayableCube key={[`cube`, myUserKey()!]} /> : null}
				</>
			) : null}
		</>
	)
}

const distForward = 10
const offsetRight = -2
const offsetUp = 1

function createDragProjection() {
	const forward = new THREE.Vector3()
	const right = new THREE.Vector3()
	const upWorld = new THREE.Vector3(0, 1, 0)
	const upCam = new THREE.Vector3()
	const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)

	const hitPoint = new THREE.Vector3()

	return { forward, right, upWorld, upCam, plane, hitPoint }
}

function PlayableTile(props: { key: readonly [`tile`, UserKey] }): Children {
	const { forward, right, upWorld, upCam, plane, hitPoint } =
		createDragProjection()
	const ref: { current: THREE.Mesh | null } = { current: null }
	const attach = (mesh: THREE.Mesh | null) => {
		if (mesh || getState(cameraAnchoredSphereAtom) === ref.current)
			setState(cameraAnchoredSphereAtom, mesh)
		ref.current = mesh
	}
	onCleanup(() => {
		if (getState(cameraAnchoredSphereAtom) === ref.current)
			setState(cameraAnchoredSphereAtom, null)
	})
	const setControlsEnabled = useSetter(controlsEnabledAtom)
	const dragState = useGetter(dragStateAtom)
	const socket = usePlayerActions()

	const cancelDrag = () => {
		if (getState(dragStateAtom) !== `tile`) return
		setControlsEnabled(true)
		setState(dragStateAtom, null)
		setState(dragPointAtom, null)
	}
	onCleanup(cancelDrag)

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
							props.key[1],
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
						props.key[1],
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
						props.key[1],
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

	onSceneFrame(() => {
		if (!ref.current) return

		switch (dragState()) {
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

	return (
		<HexTile
			ref={attach}
			onPointerDown={startDrag}
			onPointerUp={endDrag}
			onPointerCancel={cancelDrag}
		/>
	)
}

type PlayableCubeProps = {
	key: readonly [`cube`, UserKey]
}
function PlayableCube(props: PlayableCubeProps): Children {
	const { forward, right, upWorld, upCam, plane, hitPoint } =
		createDragProjection()
	const ref: { current: THREE.Mesh | null } = { current: null }
	const attach = (mesh: THREE.Mesh | null) => {
		if (mesh || getState(cameraAnchoredSphereAtom) === ref.current)
			setState(cameraAnchoredSphereAtom, mesh)
		ref.current = mesh
	}
	onCleanup(() => {
		if (getState(cameraAnchoredSphereAtom) === ref.current)
			setState(cameraAnchoredSphereAtom, null)
	})
	const setControlsEnabled = useSetter(controlsEnabledAtom)
	const dragState = useGetter(dragStateAtom)
	const myColor = useGetter(playerColorAtoms, props.key[1])
	const socket = usePlayerActions()

	const cancelDrag = () => {
		if (getState(dragStateAtom) !== `cube`) return
		setControlsEnabled(true)
		setState(dragStateAtom, null)
		setState(dragPointAtom, null)
	}
	onCleanup(cancelDrag)

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
					const closestOwnedTile = getState(
						closestOwnedTileSelectors,
						props.key[1],
					)
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
					const closestOwnedTile = getState(
						closestOwnedTileSelectors,
						props.key[1],
					)
					if (closestOwnedTile) {
						setState(
							tileCubeCountAtoms,
							closestOwnedTile,
							(current) => (current + 1) as TileCubeCount,
						)
						setState(
							playerRemainingCubesAtoms,
							props.key[1],
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
				setState(
					playerRemainingCubesAtoms,
					props.key[1],
					(current) => current - 1,
				)
				setState(tileOwnerAtoms, turnInProgress.target, props.key[1])
				setState(turnInProgressAtom, null)
				socket.emit(`placeCube`, turnInProgress.target)
				break
		}
	}

	onSceneFrame(() => {
		if (!ref.current) return

		switch (dragState()) {
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
			ref={attach}
			onPointerDown={startDrag}
			onPointerUp={endDrag}
			onPointerCancel={cancelDrag}
			color={myColor() ?? `#555`}
		/>
	)
}
