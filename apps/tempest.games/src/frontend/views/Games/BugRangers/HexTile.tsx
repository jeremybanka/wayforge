/** biome-ignore-all lint/a11y/noStaticElementInteractions: drei */

import { Text } from "@react-three/drei"
import { getState, setState } from "atom.io"
import { useO } from "atom.io/react"
import { usePullAtomFamilyMember } from "atom.io/realtime-react"
import type { ReactNode, RefObject } from "react"
import { useMemo, useState } from "react"
import * as THREE from "three"

import type { TileCoordinatesSerialized } from "../../../../library/bug-rangers-game-state"
import {
	closestPlayableZoneSelector,
	deserializeTileCoordinates,
	gameTilesAtom,
	gameTilesStackHeightAtoms,
	tile3dPositionSelectors,
	tileCubeCountAtoms,
	tileOwnerAtoms,
} from "../../../../library/bug-rangers-game-state"
import { cameraTargetAtom } from "./bug-rangers-client-state"
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
	color = `#ee5`,
}: {
	coordinatesSerialized: TileCoordinatesSerialized
	color?: THREE.ColorRepresentation
}): ReactNode {
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
				position3d={tile3dPosition}
				color={isClosest ? `#f00` : color}
				onClick={(position3d) => {
					setState(cameraTargetAtom, position3d.toArray())
					setState(gameTilesAtom, (permanent) => {
						console.log({ coordinates })
						permanent.add(coordinatesSerialized)
						return permanent
					})
				}}
				virtual={true}
			/>
		</>
	)
}
export function GameTileActual({
	coordinatesSerialized,
	color = `#ee5`,
	onClick,
}: {
	coordinatesSerialized: TileCoordinatesSerialized
	color?: THREE.ColorRepresentation
	onClick?: (position: THREE.Vector3) => void
}): ReactNode {
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

	const tile3dPosition = getState(tile3dPositionSelectors, coordinatesSerialized)
	const [x, _, z] = tile3dPosition
	const closestPlayableZone = useO(closestPlayableZoneSelector)
	const isClosest = closestPlayableZone === coordinatesSerialized

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
				color={isClosest ? `#f00` : color}
				onClick={(position3d) => {
					setState(cameraTargetAtom, position3d.toArray())
				}}
				virtual={false}
			/>
			{stackHeight > 1 ? (
				<HexTile
					position3d={new THREE.Vector3(x, 0.33, z)}
					color={color}
					onClick={onClick}
				/>
			) : null}
			{stackHeight > 2 ? (
				<HexTile position3d={new THREE.Vector3(x, 0.66, z)} color={color} />
			) : null}
		</>
	)
}
export function GameTile({
	coordinatesSerialized,
	color = `#ee5`,
	virtual = false,
	onClick,
}: {
	coordinatesSerialized: TileCoordinatesSerialized
	color?: THREE.ColorRepresentation
	virtual?: boolean
	onClick?: (position: THREE.Vector3) => void
}): ReactNode {
	return virtual ? (
		<GameTilePreview
			coordinatesSerialized={coordinatesSerialized}
			color={color}
			onClick={onClick as VoidFunction}
		/>
	) : (
		<GameTileActual
			coordinatesSerialized={coordinatesSerialized}
			color={color}
			onClick={onClick as VoidFunction}
		/>
	)
}
