import { atom, atomFamily, mutableAtom, selector, selectorFamily } from "atom.io"
import { UList } from "atom.io/transceivers/u-list"
import * as THREE from "three"

export const cameraTargetAtom = atom<[x: number, y: number, z: number]>({
	key: `cameraTarget`,
	default: [0, 0, 0],
})

export const controlsEnabledAtom = atom<boolean>({
	key: `controlsEnabled`,
	default: true,
})

export type DragState = `cube` | `tile` | null

export const dragStateAtom = atom<DragState>({
	key: `dragState`,
	default: null,
})

export const cameraAnchoredSphereAtom = atom<THREE.Mesh | null>({
	key: `cameraAnchoredSphere`,
	default: null,
})

export const dragpointAtom = atom<THREE.Vector3 | null>({
	key: `dragpoint`,
	default: null,
})

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
export const tile3dPositionSelectors = selectorFamily<
	THREE.Vector3,
	TileCoordinatesSerialized
>({
	key: `tile3dPosition`,
	get: (coordinatesSerialized) => () => {
		const [boardA, boardB, boardC] = deserializeTileCoordinates(
			coordinatesSerialized,
		)

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

		return new THREE.Vector3(x, 0, z)
	},
})

export const adjacentZonesSelector = selectorFamily<
	TileCoordinatesSerialized[],
	TileCoordinatesSerialized
>({
	key: `adjacentZones`,
	get: (coordinatesSerialized) => () => {
		const [x, y, z] = deserializeTileCoordinates(coordinatesSerialized)
		const playableZones = new Set<TileCoordinatesSerialized>()

		playableZones.add(`${x + 1}_${y - 1}_${z}`)
		playableZones.add(`${x + 1}_${y}_${z - 1}`)
		playableZones.add(`${x - 1}_${y + 1}_${z}`)
		playableZones.add(`${x - 1}_${y}_${z + 1}`)
		playableZones.add(`${x + 2}_${y - 1}_${z - 1}`)
		playableZones.add(`${x - 2}_${y + 1}_${z + 1}`)

		return Array.from(playableZones)
	},
})

export const adjacentTilesSelector = selectorFamily<
	TileCoordinatesSerialized[],
	TileCoordinatesSerialized
>({
	key: `adjacentTiles`,
	get:
		(coordinatesSerialized) =>
		({ get }) => {
			const playableZones = get(adjacentZonesSelector, coordinatesSerialized)
			const tiles = get(gameTilesAtom)
			return playableZones.filter((adjacentZone) => tiles.has(adjacentZone))
		},
})

export const playableZonesAtom = selector<TileCoordinatesSerialized[]>({
	key: `playableZone`,
	get: ({ get }) => {
		const tiles = get(gameTilesAtom)
		if (tiles.size === 0) return [`0_0_0`]
		const playableZones = new Set<TileCoordinatesSerialized>()

		for (const tileCoordinates of tiles) {
			const adjacentZones = get(adjacentZonesSelector, tileCoordinates)
			for (const adjacentZone of adjacentZones) {
				playableZones.add(adjacentZone)
			}
		}
		for (const tileCoordinates of tiles) {
			playableZones.delete(tileCoordinates)
		}
		for (const playableZone of playableZones) {
			const adjacentTiles = get(adjacentTilesSelector, playableZone)
			if (adjacentTiles.length >= 5) {
				playableZones.delete(playableZone)
			}
		}
		return Array.from(playableZones)
	},
})

export type StackHeight = 1 | 2 | 3
export const gameTilesStackHeightAtoms = atomFamily<
	StackHeight,
	TileCoordinatesSerialized
>({
	key: `gameTilesStackHeight`,
	default: 1,
})

export const closestPlayableZoneSelector =
	selector<TileCoordinatesSerialized | null>({
		key: `closestPlayableZone`,
		get: ({ get }) => {
			const dragpoint = get(dragpointAtom)
			if (!dragpoint) return null

			let closest: TileCoordinatesSerialized | null = null
			let closestDistance = Number.POSITIVE_INFINITY
			for (const tileCoordinates of get(playableZonesAtom)) {
				const position = get(tile3dPositionSelectors, tileCoordinates)
				const distance = dragpoint.distanceTo(position)
				if (distance < closestDistance) {
					closestDistance = distance
					closest = tileCoordinates
				}
			}
			return closest
		},
	})

export type TileCubeCount =
	| 0
	| 1
	| 2
	| 3
	| 4
	| 5
	| 6
	| 7
	| 8
	| 9
	| 10
	| 11
	| 12
	| 13
	| 14
	| 15
	| 16
	| 17
	| 18
	| 19
	| 20
export const tileCubeCountAtoms = atomFamily<
	TileCubeCount,
	TileCoordinatesSerialized
>({
	key: `tileCubeCount`,
	default: 1,
})

export type TurnActionType = `arm` | `build` | `war`
export type BuildAction = {
	type: `build`
	target: TileCoordinatesSerialized
	count: TileCubeCount
}
export type ArmAction = {
	type: `arm`
	targets: [TileCoordinatesSerialized, TileCoordinatesSerialized]
}
export type ArmActionInProgress = {
	type: `arm`
	targets:
		| []
		| [TileCoordinatesSerialized, TileCoordinatesSerialized]
		| [TileCoordinatesSerialized]
}
export type WarAction = {
	type: `war`
	path: TileCoordinatesSerialized[]
	counts: number[]
}
export type TurnAction = ArmAction | BuildAction | WarAction
export type TurnActionInProgress = ArmActionInProgress | BuildAction
export const turnInProgressAtom = atom<TurnActionInProgress | null>({
	key: `turnInProgress`,
	default: null,
})
