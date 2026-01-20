/** biome-ignore-all lint/a11y/noStaticElementInteractions: drei */

import { Text } from "@react-three/drei"
import { getState, setState } from "atom.io"
import { useO } from "atom.io/react"
import {
	usePullAtom,
	usePullAtomFamilyMember,
	usePullSelector,
	usePullSelectorFamilyMember,
} from "atom.io/realtime-react"
import type { ReactNode, RefObject } from "react"
import { useMemo, useState } from "react"
import * as THREE from "three"

import type { TileCoordinatesSerialized } from "../../../../library/game-systems/bug-rangers-game-state"
import {
	closestPlayableZoneSelector,
	deserializeTileCoordinates,
	gameTilesAtom,
	gameTilesStackHeightAtoms,
	setWarTarget,
	tile3dPositionSelectors,
	tileCubeCountAtoms,
	tileOwnerAtoms,
	tileStatusSelectors,
	turnInProgressAtom,
	winningTilesSelector,
} from "../../../../library/game-systems/bug-rangers-game-state"
import { playerTurnSelector } from "../../../../library/game-systems/turn-based-game-state"
import {
	cameraTargetAtom,
	isMyTurnSelector,
	usePlayerActions,
} from "./bug-rangers-client-state"
import { CubeTokenStack } from "./CubeToken"

/**
 * HexTile
 *
 * A short hexagonal prism shaped exactly like one of the hexes in the grid.
 * Props:
 * - radius: circumradius of the hexagon (same as HexGridHelper)
 * - height: thickness of the prism
 * - position: center position
 */
export function HexTile({
	ref,
	radius = 1,
	height = 0.3,
	position3d = new THREE.Vector3(0, 0, 0),
	color = `#ee5`,
	virtual = false,
	onClick,
	onPointerDown,
	onPointerUp,
}: {
	ref?: { current: THREE.Mesh | null }
	radius?: number
	height?: number
	position3d?: THREE.Vector3
	color?: THREE.ColorRepresentation
	virtual?: boolean
	onClick?: ((position: THREE.Vector3) => void) | undefined
	onPointerDown?: ((position: THREE.Vector3) => void) | undefined
	onPointerUp?: ((position: THREE.Vector3) => void) | undefined
}): ReactNode {
	const [hovered, setHovered] = useState(false)

	// Build a hexagonal shape
	const shape = useMemo(() => {
		const s = new THREE.Shape()
		for (let i = 0; i < 6; i++) {
			const angle = (Math.PI / 180) * (60 * i)
			const x = radius * Math.cos(angle)
			const y = radius * Math.sin(angle)
			if (i === 0) s.moveTo(x, y)
			else s.lineTo(x, y)
		}
		s.closePath()
		return s
	}, [radius])

	const geom = useMemo(
		() =>
			new THREE.ExtrudeGeometry(shape, {
				depth: virtual ? height - 0.1 : height,
				bevelEnabled: false,
			}),
		[shape, height],
	)

	return (
		<mesh
			ref={ref as RefObject<THREE.Mesh>}
			geometry={geom}
			position={position3d}
			rotation={[-Math.PI / 2, 0, 0]}
			castShadow
			receiveShadow
			onClick={() => {
				onClick?.(position3d)
			}}
			onPointerOver={() => {
				setHovered(true)
			}}
			onPointerOut={() => {
				setHovered(false)
			}}
			onPointerDown={() => {
				onPointerDown?.(position3d)
			}}
			onPointerUp={() => {
				onPointerUp?.(position3d)
			}}
		>
			<meshStandardMaterial
				color={color}
				transparent={virtual}
				opacity={virtual ? (hovered ? 0.5 : 0.2) : 1}
			/>
		</mesh>
	)
}

export function GameTilePreview({
	coordinatesSerialized,
}: {
	coordinatesSerialized: TileCoordinatesSerialized
}): ReactNode {
	const socket = usePlayerActions()
	const coordinates = deserializeTileCoordinates(coordinatesSerialized)
	const [boardA, boardB, boardC] = coordinates
	const tile3dPosition = getState(tile3dPositionSelectors, coordinatesSerialized)
	const [x, _, z] = tile3dPosition
	const closestPlayableZone = useO(closestPlayableZoneSelector)
	const isClosest = closestPlayableZone === coordinatesSerialized

	if (boardA + boardB + boardC !== 0) {
		console.error(`GameTile: bad coordinates did not add to zero`, coordinates)
		return null
	}

	const height = 0.2

	return (
		<>
			<Text position={[x, height + 0.7, z]} fontSize={0.25} color="white">
				{coordinatesSerialized}
			</Text>

			<HexTile
				virtual={true}
				position3d={tile3dPosition}
				color={isClosest ? `#f00` : `#0ff`}
				onClick={(position3d) => {
					setState(cameraTargetAtom, position3d.toArray())

					const turnInProgress = getState(turnInProgressAtom)
					if (turnInProgress?.type === `move`) {
						const { origin } = turnInProgress
						const target = coordinatesSerialized
						setState(turnInProgressAtom, {
							...turnInProgress,
							target,
						})
						const originCubeCount = getState(tileCubeCountAtoms, origin)
						setState(tileCubeCountAtoms, target, originCubeCount)
						setState(tileCubeCountAtoms, origin, 0)
						setState(gameTilesAtom, (permanent) => {
							permanent.delete(origin)
							permanent.add(target)
							return permanent
						})
						socket.emit(`finishMove`, target)
					} else {
						setState(gameTilesAtom, (permanent) => {
							permanent.add(coordinatesSerialized)
							return permanent
						})
						socket.emit(`placeTile`, coordinatesSerialized)
					}
				}}
			/>
		</>
	)
}
export function GameTileActual({
	coordinatesSerialized,
}: {
	coordinatesSerialized: TileCoordinatesSerialized
}): ReactNode {
	const socket = usePlayerActions()
	const coordinates = deserializeTileCoordinates(coordinatesSerialized)
	const [boardA, boardB, boardC] = coordinates
	const stackHeight = usePullAtomFamilyMember(
		gameTilesStackHeightAtoms,
		coordinatesSerialized,
	)
	const tileCubeCount = usePullAtomFamilyMember(
		tileCubeCountAtoms,
		coordinatesSerialized,
	)
	const ownerKey = usePullAtomFamilyMember(tileOwnerAtoms, coordinatesSerialized)
	const currentTurn = usePullSelector(playerTurnSelector)
	const isMyTurn = usePullSelector(isMyTurnSelector)

	const tile3dPosition = getState(tile3dPositionSelectors, coordinatesSerialized)
	const [x, _, z] = tile3dPosition

	const turnInProgress = usePullAtom(turnInProgressAtom)

	const status = usePullSelectorFamilyMember(
		tileStatusSelectors,
		coordinatesSerialized,
	)

	const winningTiles = usePullSelector(winningTilesSelector)

	let color: string
	if (winningTiles === null) {
		switch (status) {
			case null:
				color = `#aa5`
				break
			case `mayBeInvaded`:
			case `isMovingToHere`:
				color = `#664`
				break
			case `isInvader`:
			case `isMovingFromHere`:
				color = `#ee1`
				break
			case `mayInvade`:
			case `mayBeMoved`:
				color = `#cc3`
				break
		}
	} else {
		if (winningTiles.has(coordinatesSerialized)) {
			color = `#ff0`
		} else {
			color = `#00f`
		}
	}

	if (boardA + boardB + boardC !== 0) {
		console.error(`GameTile: bad coordinates did not add to zero`, coordinates)
		return null
	}

	const height = stackHeight * 0.33

	return (
		<>
			<Text position={[x, height + 0.7, z]} fontSize={0.25} color="white">
				{coordinatesSerialized}
			</Text>
			{ownerKey !== null && tileCubeCount > 0 ? (
				<CubeTokenStack
					position={new THREE.Vector3(x, height + 0.25, z)}
					count={tileCubeCount}
					ownerKey={ownerKey}
				/>
			) : null}
			<HexTile
				position3d={tile3dPosition}
				color={color}
				onClick={(position3d) => {
					setState(cameraTargetAtom, position3d.toArray())
					if (isMyTurn && status === `mayInvade`) {
						setState(turnInProgressAtom, {
							type: `war`,
							attacker: coordinatesSerialized,
							targets: [],
							originalOwners: {},
						})
						socket.emit(`chooseAttacker`, coordinatesSerialized)
					}
					if (isMyTurn && status === `mayBeInvaded`) {
						if (
							turnInProgress?.type === `war` &&
							turnInProgress.attacker !== null
						) {
							setWarTarget(
								currentTurn,
								ownerKey,
								stackHeight,
								turnInProgress,
								coordinatesSerialized,
							)
							socket.emit(`chooseTarget`, coordinatesSerialized)
						}
					}
					if (isMyTurn && status === `mayBeMoved`) {
						setState(turnInProgressAtom, {
							type: `move`,
							origin: coordinatesSerialized,
							target: null,
						})
						socket.emit(`startMove`, coordinatesSerialized)
					}
				}}
				virtual={false}
			/>
			{stackHeight > 1 ? (
				<HexTile position3d={new THREE.Vector3(x, 0.33, z)} color={color} />
			) : null}
			{stackHeight > 2 ? (
				<HexTile position3d={new THREE.Vector3(x, 0.66, z)} color={color} />
			) : null}
		</>
	)
}
