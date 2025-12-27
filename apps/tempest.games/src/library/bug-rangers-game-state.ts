import {
	atom,
	atomFamily,
	getInternalRelations,
	mutableAtom,
	selector,
	selectorFamily,
} from "atom.io"
import { type UserKey, usersInRooms } from "atom.io/realtime"
import { myRoomKeySelector } from "atom.io/realtime-client"
import { OList } from "atom.io/transceivers/o-list"
import { UList } from "atom.io/transceivers/u-list"
import * as THREE from "three"

export type PlayerActions = {
	// DEBUG
	startOver: () => void
	// SETUP PHASE
	wantFirst: () => void
	wantNotFirst: () => void
	startGame: () => void
	// FIRST TURN
	chooseColor: (color: PlayerColor) => void
	// PLAYERS
	placeTile: (tileCoordinates: TileCoordinatesSerialized) => void
	placeCube: (tileCoordinates: TileCoordinatesSerialized) => void
	turnRestart: () => void
	turnEnd: () => void
}

export type DragState = `cube` | `tile` | null

export const dragStateAtom = atom<DragState>({
	key: `dragState`,
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

export type TileStackHeight = 1 | 2 | 3
export const gameTilesStackHeightAtoms = atomFamily<
	TileStackHeight,
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

export const ownedTilesSelector = selectorFamily<
	TileCoordinatesSerialized[],
	UserKey
>({
	key: `ownedTiles`,
	get:
		(userKey) =>
		({ get, json }) => {
			const tiles = get(json(gameTilesAtom))
			return tiles.filter(
				(tileCoordinates) => get(tileOwnerAtoms, tileCoordinates) === userKey,
			)
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
	default: 0,
})

export const tileOwnerAtoms = atomFamily<
	UserKey | null,
	TileCoordinatesSerialized
>({
	key: `tileOwner`,
	default: null,
})

export const closestOwnedTileSelector = selectorFamily<
	TileCoordinatesSerialized | null,
	UserKey
>({
	key: `closestOwnedTile`,
	get:
		(userKey) =>
		({ get }) => {
			const ownedTiles = get(ownedTilesSelector, userKey)
			if (ownedTiles.length === 0) return null
			const dragpoint = get(dragpointAtom)
			if (!dragpoint) return null
			let closestDistance = Number.POSITIVE_INFINITY
			let closest: TileCoordinatesSerialized | null = null
			for (const tileCoordinates of ownedTiles) {
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

export type TurnActionType = `arm` | `build` | `war`
export type BuildAction = {
	type: `build`
	target: TileCoordinatesSerialized
	count: TileStackHeight
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

export const maximumStackHeightSelectors = selectorFamily<
	TileStackHeight | 0,
	[tile: TileCoordinatesSerialized, userKey: UserKey]
>({
	key: `maximumStackHeight`,
	get:
		([coordinatesSerialized, userKey]) =>
		({ get }) => {
			// const isOwned = get(tileOwnerAtoms, coordinatesSerialized) === userKey
			// if (!isOwned) return 0
			const adjacentTiles = get(adjacentTilesSelector, coordinatesSerialized)
			const ownedAdjacentTiles = adjacentTiles.filter(
				(adjacentTile) => get(tileOwnerAtoms, adjacentTile) === userKey,
			)
			let tallestOwnedAdjacentStackHeight: TileStackHeight | 0 = 0
			for (const adjacentTile of ownedAdjacentTiles) {
				const adjacentStackHeight = get(gameTilesStackHeightAtoms, adjacentTile)
				if (adjacentStackHeight >= 2) {
					return 3
				}
				if (adjacentStackHeight > tallestOwnedAdjacentStackHeight) {
					tallestOwnedAdjacentStackHeight = adjacentStackHeight
				}
			}
			return (tallestOwnedAdjacentStackHeight + 1) as TileStackHeight
		},
})

export const playerTurnOrderAtom = mutableAtom<OList<UserKey>>({
	key: `playerTurnOrder`,
	class: OList,
})

export const spectatorsSelector = selector<UserKey[]>({
	key: `spectators`,
	get: ({ get }) => {
		const order = get(playerTurnOrderAtom)
		const myRoomKey = get(myRoomKeySelector)
		const spectators: UserKey[] = []
		if (!myRoomKey) return spectators
		const [usersInRoomsAtoms] = getInternalRelations(usersInRooms, `split`)
		const usersHere = get(usersInRoomsAtoms, myRoomKey)
		for (const key of usersHere) if (!order.includes(key)) spectators.push(key)
		return spectators
	},
})

export const turnNumberAtom = atom<number>({
	key: `turnNumber`,
	default: 0,
})

export const playerTurnSelector = selector<UserKey | null>({
	key: `playerTurn`,
	get: ({ get }) => {
		const turnNumber = get(turnNumberAtom)
		const playerTurnOrder = get(playerTurnOrderAtom)
		if (playerTurnOrder.length === 0) return null
		const index = turnNumber % playerTurnOrder.length
		return playerTurnOrder[index]
	},
})

export type PlayerReadyStatus =
	| `notReady`
	| `readyDoesNotWantFirst`
	| `readyWantsFirst`
export const playerReadyStatusAtoms = atomFamily<PlayerReadyStatus, UserKey>({
	key: `playerReadyStatus`,
	default: `notReady`,
})

export type GameState = `playing` | `recap` | `setup`
export const gameStateAtom = atom<GameState>({
	key: `gameState`,
	default: `setup`,
})

export const setupGroupsSelector = selector<
	Record<PlayerReadyStatus, UserKey[]>
>({
	key: `setupGroups`,
	get: ({ get }) => {
		const notReady: UserKey[] = []
		const readyDoesNotWantFirst: UserKey[] = []
		const readyWantsFirst: UserKey[] = []
		const turnOrder = get(playerTurnOrderAtom)
		const roomKey = get(myRoomKeySelector)
		if (!roomKey) {
			return { notReady, readyDoesNotWantFirst, readyWantsFirst }
		}
		const [usersInRoomsAtoms] = getInternalRelations(usersInRooms, `split`)
		const usersHere = get(usersInRoomsAtoms, roomKey)
		for (const userKey of usersHere) {
			const playerReadyStatus = get(playerReadyStatusAtoms, userKey)
			if (turnOrder.includes(userKey)) continue
			switch (playerReadyStatus) {
				case `notReady`:
					notReady.push(userKey)
					break
				case `readyDoesNotWantFirst`:
					readyDoesNotWantFirst.push(userKey)
					break
				case `readyWantsFirst`:
					readyWantsFirst.push(userKey)
					break
			}
		}
		return { notReady, readyDoesNotWantFirst, readyWantsFirst }
	},
})

export const PLAYER_COLORS = [
	`#f5a`,
	`#fa5`,
	`#af5`,
	`#a5f`,
	`#5fa`,
	`#5af`,
] as const
export type PlayerColor = (typeof PLAYER_COLORS)[number]
export const PLAYER_COLOR_DISPLAY_NAMES = {
	[`#f5a`]: `Red`,
	[`#fa5`]: `Orange`,
	[`#af5`]: `Yellow`,
	[`#a5f`]: `Green`,
	[`#5fa`]: `Blue`,
	[`#5af`]: `Purple`,
} as const satisfies Record<PlayerColor, string>
export const playerColorAtoms = atomFamily<PlayerColor | null, UserKey>({
	key: `playerColor`,
	default: null,
})
