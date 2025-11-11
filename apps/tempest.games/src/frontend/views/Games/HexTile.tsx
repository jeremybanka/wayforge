/** biome-ignore-all lint/a11y/noStaticElementInteractions: drei */

import { Text } from "@react-three/drei"
import { atomFamily, mutableAtom, selector, setState } from "atom.io"
import { useJSON, useO } from "atom.io/react"
import { UList } from "atom.io/transceivers/u-list"
import type { ReactNode } from "react"
import { useMemo, useState } from "react"
import * as THREE from "three"

import { cameraTargetAtom } from "./BugRangers"
/// <reference types="@react-three/fiber" />

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
	radius = 1,
	height = 0.3,
	position3d = [0, 0, 0],
	color = `#ee5`,
	virtual = false,
	onClick,
}: {
	radius?: number
	height?: number
	position3d?: [number, number, number]
	color?: THREE.ColorRepresentation
	virtual?: boolean
	onClick?: ((position: [x: number, y: number, z: number]) => void) | undefined
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
				depth: height,
				bevelEnabled: false,
			}),
		[shape, height],
	)

	return (
		<mesh
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
		>
			<meshStandardMaterial
				color={color}
				transparent={virtual}
				opacity={virtual ? (hovered ? 0.5 : 0.2) : 1}
			/>
		</mesh>
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
	onClick?: (position: [x: number, y: number, z: number]) => void
}): ReactNode {
	const coordinates = deserializeTileCoordinates(coordinatesSerialized)
	const [boardA, boardB, boardC] = coordinates
	const stackHeight = useO(gameTilesStackHeightAtoms, coordinates)
	if (boardA + boardB + boardC !== 0) {
		console.error(`GameTile: bad coordinates did not add to zero`, coordinates)
		return null
	}

	const unit = Math.sqrt(3)
	const a60 = Math.PI / 3
	const a120 = a60 * 2
	const sin60 = Math.sin(a60)
	const cos60 = Math.cos(a60)
	const sin120 = Math.sin(a120)
	const cos120 = Math.cos(a120)

	const uA = unit * boardA
	const uB = unit * boardB
	const uC = unit * boardC

	const sin60UA = uA * sin60
	const cos60UA = uA * cos60

	const sin120UB = uB * sin120
	const cos120UB = uB * cos120

	const x = sin60UA + sin120UB
	const z = cos60UA + cos120UB + uC

	return (
		<>
			<Text position={[x, 0.5, z]} fontSize={0.5} color="white">
				{coordinatesSerialized}
			</Text>
			<HexTile
				position3d={[x, 0, z]}
				color={color}
				onClick={(position3d) => {
					setState(cameraTargetAtom, position3d)
					if (virtual) {
						setState(gameTilesAtom, (permanent) => {
							console.log({ coordinates })
							permanent.add(coordinatesSerialized)
							return permanent
						})
					}
				}}
				virtual={virtual}
			/>
			{stackHeight > 1 ? (
				<HexTile position3d={[x, 0.33, z]} color={color} onClick={onClick} />
			) : null}
			{stackHeight > 2 ? (
				<HexTile position3d={[x, 0.66, z]} color={color} onClick={onClick} />
			) : null}
		</>
	)
}

export type TileCoordinates = [x: number, y: number, z: number]
export type TileCoordinatesSerialized = `${number}_${number}_${number}`
export function serializeTileCoordinates(
	coordinates: TileCoordinates,
): TileCoordinatesSerialized {
	return `${coordinates[0]}_${coordinates[1]}_${coordinates[2]}`
}

export function deserializeTileCoordinates(
	serialized: TileCoordinatesSerialized,
): TileCoordinates {
	return serialized.split(`_`).map(Number) as TileCoordinates
}

export const gameTilesAtom = mutableAtom<UList<TileCoordinatesSerialized>>({
	key: `gameTiles`,
	class: UList,
})

export const playableZonesAtom = selector<TileCoordinatesSerialized[]>({
	key: `playableZonesAtom`,
	get: ({ get }) => {
		const tiles = get(gameTilesAtom)
		if (tiles.size === 0) return [`0_0_0`]
		const playableZones = new Set<TileCoordinatesSerialized>()

		console.log(`tiles`, tiles)

		for (const tileCoordinates of tiles) {
			const [x, y, z] = deserializeTileCoordinates(tileCoordinates)
			playableZones.add(`${x + 1}_${y - 1}_${z}`)
			playableZones.add(`${x + 1}_${y}_${z - 1}`)
			playableZones.add(`${x - 1}_${y + 1}_${z}`)
			playableZones.add(`${x - 1}_${y}_${z + 1}`)
			playableZones.add(`${x + 2}_${y - 1}_${z - 1}`)
			playableZones.add(`${x - 2}_${y + 1}_${z + 1}`)
		}
		return Array.from(playableZones)
	},
})

export const gameTilesStackHeightAtoms = atomFamily<number, TileCoordinates>({
	key: `gameTilesStackHeightAtoms`,
	default: 0,
})

export function GameTiles(): ReactNode {
	const tiles = useJSON(gameTilesAtom)
	return tiles.map((tileCoordinates, idx) => (
		<GameTile key={idx} coordinatesSerialized={tileCoordinates} color={`#aa5`} />
	))
}

export function PlayableZones(): ReactNode {
	// return <GameTile coordinatesSerialized={`0_0_0`} color={`#0ff`} virtual />
	const playableZones = useO(playableZonesAtom)
	return playableZones.map((coordinatesSerialized, idx) => (
		<GameTile
			key={idx}
			coordinatesSerialized={coordinatesSerialized}
			color={`#0ff`}
			virtual
		/>
	))
}

// if (virtual) {
// 					setState(gameTilesAtom, (permanent) => {
// 						console.log({ position })
// 						permanent.add(serializeTileCoordinates(position))
// 						return permanent
// 					})
// 				}
