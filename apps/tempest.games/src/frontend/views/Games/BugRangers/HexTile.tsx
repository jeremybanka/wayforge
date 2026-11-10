import type { Children } from "@atom.io/spa"
import {
	onCleanup,
	useDisposal,
	useGetter,
	useId,
	useSetter,
} from "@atom.io/spa"
import { bindScene } from "@atom.io/spa/renderer"
import { Mesh } from "@atom.io/spa/three"
import { atomFamily, getState, setState } from "atom.io"
import * as THREE from "three"

import type { TileCoordinatesSerialized } from "../../../../library/bug-rangers-game-state"
import {
	closestPlayableZoneSelector,
	deserializeTileCoordinates,
	gameTilesAtom,
	gameTilesStackHeightAtoms,
	playerTurnSelector,
	setWarTarget,
	tile3dPositionSelectors,
	tileCubeCountAtoms,
	tileOwnerAtoms,
	tileStatusSelectors,
	turnInProgressAtom,
	winningTilesSelector,
} from "../../../../library/bug-rangers-game-state"
import {
	usePullAtom,
	usePullAtomFamilyMember,
	usePullSelector,
	usePullSelectorFamilyMember,
} from "../../../services/realtime-hooks"
import {
	cameraTargetAtom,
	isMyTurnSelector,
	usePlayerActions,
} from "./bug-rangers-client-state"
import { CubeTokenStack } from "./CubeToken"
import { TileLabel } from "./TileLabel"

const tileHoveredAtoms = atomFamily<boolean, string>({
	key: `tileHovered`,
	default: false,
})

export function HexTile(props: {
	ref?: (mesh: THREE.Mesh | null) => void
	radius?: number
	height?: number
	position3d?: THREE.Vector3
	color?: THREE.ColorRepresentation
	virtual?: boolean
	onClick?: (position: THREE.Vector3) => void
	onPointerDown?: (position: THREE.Vector3) => void
	onPointerUp?: (position: THREE.Vector3) => void
	onPointerCancel?: () => void
}): Children {
	const instanceKey = useId()
	const disposeState = useDisposal()
	const hovered = useGetter(tileHoveredAtoms, instanceKey)
	const setHovered = useSetter(tileHoveredAtoms, instanceKey)
	onCleanup(() => {
		disposeState(tileHoveredAtoms, instanceKey)
	})
	const shape = new THREE.Shape()
	for (let i = 0; i < 6; i++) {
		const angle = (Math.PI / 3) * i
		const x = (props.radius ?? 1) * Math.cos(angle)
		const y = (props.radius ?? 1) * Math.sin(angle)
		if (i === 0) shape.moveTo(x, y)
		else shape.lineTo(x, y)
	}
	shape.closePath()
	const geometry = new THREE.ExtrudeGeometry(shape, {
		depth: (props.height ?? 0.3) - (props.virtual ? 0.1 : 0),
		bevelEnabled: false,
	})
	const material = new THREE.MeshStandardMaterial()
	onCleanup(() => {
		geometry.dispose()
		material.dispose()
	})
	bindScene(
		() => [props.color ?? `#ee5`, props.virtual, hovered()] as const,
		([color, virtual, isHovered]) => {
			material.color.set(color)
			material.transparent = !!virtual
			material.opacity = virtual ? (isHovered ? 0.5 : 0.2) : 1
		},
	)
	return (
		<Mesh
			args={[geometry, material]}
			rotation={[-Math.PI / 2, 0, 0]}
			position={
				props.position3d
					? [props.position3d.x, props.position3d.y, props.position3d.z]
					: [0, 0, 0]
			}
			ref={(mesh) => {
				props.ref?.(mesh)
			}}
			onClick={(event) => {
				props.onClick?.(props.position3d ?? event.currentTarget.position)
			}}
			onPointerOver={() => {
				setHovered(true)
			}}
			onPointerOut={() => {
				setHovered(false)
			}}
			onPointerDown={(event) => {
				if (props.onPointerDown) {
					event.setPointerCapture()
					event.nativeEvent.stopImmediatePropagation()
				}
				props.onPointerDown?.(event.currentTarget.position)
			}}
			onPointerCancel={() => {
				props.onPointerCancel?.()
			}}
			onPointerUp={(event) => {
				if (event.hasPointerCapture()) event.releasePointerCapture()
				props.onPointerUp?.(event.currentTarget.position)
			}}
		/>
	)
}

export function GameTilePreview(props: {
	coordinatesSerialized: TileCoordinatesSerialized
}): Children {
	const socket = usePlayerActions()
	const coordinates = deserializeTileCoordinates(props.coordinatesSerialized)
	const [boardA, boardB, boardC] = coordinates
	const tile3dPosition = getState(
		tile3dPositionSelectors,
		props.coordinatesSerialized,
	)
	const [x, _, z] = tile3dPosition
	const closestPlayableZone = useGetter(closestPlayableZoneSelector)
	const isClosest = () => closestPlayableZone() === props.coordinatesSerialized

	if (boardA + boardB + boardC !== 0) {
		console.error(`GameTile: bad coordinates did not add to zero`, coordinates)
		return null
	}

	const height = 0.2

	return (
		<>
			<TileLabel position={[x, height + 0.7, z]}>
				{props.coordinatesSerialized}
			</TileLabel>

			<HexTile
				virtual={true}
				position3d={tile3dPosition}
				color={isClosest() ? `#f00` : `#0ff`}
				onClick={(position3d) => {
					setState(cameraTargetAtom, position3d.toArray())

					const turnInProgress = getState(turnInProgressAtom)
					if (turnInProgress?.type === `move`) {
						const { origin } = turnInProgress
						const target = props.coordinatesSerialized
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
							permanent.add(props.coordinatesSerialized)
							return permanent
						})
						socket.emit(`placeTile`, props.coordinatesSerialized)
					}
				}}
			/>
		</>
	)
}
export function GameTileActual(props: {
	coordinatesSerialized: TileCoordinatesSerialized
}): Children {
	const socket = usePlayerActions()
	const coordinates = deserializeTileCoordinates(props.coordinatesSerialized)
	const [boardA, boardB, boardC] = coordinates
	const stackHeight = usePullAtomFamilyMember(
		gameTilesStackHeightAtoms,
		props.coordinatesSerialized,
	)
	const tileCubeCount = usePullAtomFamilyMember(
		tileCubeCountAtoms,
		props.coordinatesSerialized,
	)
	const ownerKey = usePullAtomFamilyMember(
		tileOwnerAtoms,
		props.coordinatesSerialized,
	)
	const currentTurn = usePullSelector(playerTurnSelector)
	const isMyTurn = usePullSelector(isMyTurnSelector)

	const tile3dPosition = getState(
		tile3dPositionSelectors,
		props.coordinatesSerialized,
	)
	const [x, _, z] = tile3dPosition

	const turnInProgress = usePullAtom(turnInProgressAtom)

	const status = usePullSelectorFamilyMember(
		tileStatusSelectors,
		props.coordinatesSerialized,
	)

	const winningTiles = usePullSelector(winningTilesSelector)

	const color = () => {
		let result: string
		if (winningTiles() === null) {
			switch (status()) {
				case null:
					result = `#aa5`
					break
				case `mayBeInvaded`:
				case `isMovingToHere`:
					result = `#664`
					break
				case `isInvader`:
				case `isMovingFromHere`:
					result = `#ee1`
					break
				case `mayInvade`:
				case `mayBeMoved`:
					result = `#cc3`
					break
			}
		} else {
			if (winningTiles()!.has(props.coordinatesSerialized)) {
				result = `#ff0`
			} else {
				result = `#00f`
			}
		}

		return result
	}

	if (boardA + boardB + boardC !== 0) {
		console.error(`GameTile: bad coordinates did not add to zero`, coordinates)
		return null
	}

	const height = () => stackHeight() * 0.33

	return (
		<>
			<TileLabel position={[x, height() + 0.7, z]}>
				{props.coordinatesSerialized}
			</TileLabel>
			{ownerKey() !== null && tileCubeCount() > 0 ? (
				<CubeTokenStack
					position={new THREE.Vector3(x, height() + 0.25, z)}
					count={tileCubeCount()}
					key={ownerKey()!}
					ownerKey={ownerKey()!}
				/>
			) : null}
			<HexTile
				position3d={tile3dPosition}
				color={color()}
				onClick={(position3d) => {
					setState(cameraTargetAtom, position3d.toArray())
					if (isMyTurn() && status() === `mayInvade`) {
						setState(turnInProgressAtom, {
							type: `war`,
							attacker: props.coordinatesSerialized,
							targets: [],
							originalOwners: {},
						})
						socket.emit(`chooseAttacker`, props.coordinatesSerialized)
					}
					if (isMyTurn() && status() === `mayBeInvaded`) {
						const turn = turnInProgress()
						if (turn?.type === `war` && turn.attacker !== null) {
							setWarTarget(
								currentTurn(),
								ownerKey(),
								stackHeight(),
								turn,
								props.coordinatesSerialized,
							)
							socket.emit(`chooseTarget`, props.coordinatesSerialized)
						}
					}
					if (isMyTurn() && status() === `mayBeMoved`) {
						setState(turnInProgressAtom, {
							type: `move`,
							origin: props.coordinatesSerialized,
							target: null,
						})
						socket.emit(`startMove`, props.coordinatesSerialized)
					}
				}}
				virtual={false}
			/>
			{stackHeight() > 1 ? (
				<HexTile position3d={new THREE.Vector3(x, 0.33, z)} color={color()} />
			) : null}
			{stackHeight() > 2 ? (
				<HexTile position3d={new THREE.Vector3(x, 0.66, z)} color={color()} />
			) : null}
		</>
	)
}
