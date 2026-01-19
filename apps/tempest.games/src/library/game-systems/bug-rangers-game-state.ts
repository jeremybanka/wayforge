import {
	atom,
	atomFamily,
	getState,
	mutableAtom,
	selector,
	selectorFamily,
	setState,
} from "atom.io"
import type { UserKey } from "atom.io/realtime"
import { UList } from "atom.io/transceivers/u-list"
import * as THREE from "three"

import {
	playerTurnOrderAtom,
	playerTurnSelector,
} from "./game-setup-turn-order-and-spectators"

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
	chooseAttacker: (tileCoordinates: TileCoordinatesSerialized) => void
	chooseTarget: (tileCoordinates: TileCoordinatesSerialized) => void
	startMove: (tileCoordinates: TileCoordinatesSerialized) => void
	finishMove: (tileCoordinates: TileCoordinatesSerialized) => void
	turnRestart: () => void
	turnEnd: () => void
}

export type DragState = `cube` | `tile` | null

export const dragStateAtom = atom<DragState>({
	key: `dragState`,
	default: null,
})

export const dragPointAtom = atom<THREE.Vector3 | null>({
	key: `dragPoint`,
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
		const adjacent = new Set<TileCoordinatesSerialized>()

		adjacent.add(`${x + 1}_${y - 1}_${z}`)
		adjacent.add(`${x + 1}_${y}_${z - 1}`)
		adjacent.add(`${x - 1}_${y + 1}_${z}`)
		adjacent.add(`${x - 1}_${y}_${z + 1}`)
		adjacent.add(`${x + 2}_${y - 1}_${z - 1}`)
		adjacent.add(`${x - 2}_${y + 1}_${z + 1}`)

		return Array.from(adjacent)
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
			const adjacent = get(adjacentZonesSelector, coordinatesSerialized)
			const tiles = get(gameTilesAtom)
			return adjacent.filter((zone) => tiles.has(zone))
		},
})

export const playableZonesSelector = selector<TileCoordinatesSerialized[]>({
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
		const turnInProgress = get(turnInProgressAtom)

		if (turnInProgress?.type === `move`) {
			playableZones.delete(turnInProgress.origin)
			const originAdjacentZones = get(
				adjacentZonesSelector,
				turnInProgress.origin,
			)
			for (const adjacentZone of originAdjacentZones) {
				const adjacentTiles = get(adjacentTilesSelector, adjacentZone)
				if (adjacentTiles.length === 1) {
					playableZones.delete(adjacentZone)
				}
			}
		}

		return Array.from(playableZones)
	},
})

export const tileIsStructuralSelectors = selectorFamily<
	boolean,
	TileCoordinatesSerialized
>({
	key: `tileIsStructural`,
	get:
		(coords) =>
		({ get }) => {
			const allTiles = get(gameTilesAtom)
			const allTilesWithoutThisOne = new Set(allTiles)
			allTilesWithoutThisOne.delete(coords)
			const seen = new Set<TileCoordinatesSerialized>()
			const queue: TileCoordinatesSerialized[] = []
			for (const tile of allTilesWithoutThisOne) {
				queue.push(tile)
				break
			}
			while (queue.length > 0) {
				const tile = queue.pop()!
				seen.add(tile)
				const adjacentZones = get(adjacentZonesSelector, tile)
				for (const adjacentZone of adjacentZones) {
					if (allTilesWithoutThisOne.has(adjacentZone)) {
						if (seen.has(adjacentZone)) continue
						queue.push(adjacentZone)
					}
				}
			}
			return seen.size !== allTilesWithoutThisOne.size
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
			const dragPoint = get(dragPointAtom)
			if (!dragPoint) return null

			let closest: TileCoordinatesSerialized | null = null
			let closestDistance = Number.POSITIVE_INFINITY
			for (const tileCoordinates of get(playableZonesSelector)) {
				const position = get(tile3dPositionSelectors, tileCoordinates)
				const distance = dragPoint.distanceTo(position)
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
			const dragPoint = get(dragPointAtom)
			if (!dragPoint) return null
			let closestDistance = Number.POSITIVE_INFINITY
			let closest: TileCoordinatesSerialized | null = null
			for (const tileCoordinates of ownedTiles) {
				const position = get(tile3dPositionSelectors, tileCoordinates)
				const distance = dragPoint.distanceTo(position)
				if (distance < closestDistance) {
					closestDistance = distance
					closest = tileCoordinates
				}
			}
			return closest
		},
})

// export type TurnActionType = `arm` | `build` | `war`
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
		| [TileCoordinatesSerialized, TileCoordinatesSerialized]
		| [TileCoordinatesSerialized]
}
export type WarAction = {
	type: `war`
	attacker: TileCoordinatesSerialized
	targets: TileCoordinatesSerialized[]
	originalOwners: Record<TileCoordinatesSerialized, UserKey>
}
export type MoveActionInProgress = {
	type: `move`
	origin: TileCoordinatesSerialized
	target: TileCoordinatesSerialized | null
}
export type MoveAction = {
	type: `move`
	origin: TileCoordinatesSerialized
	target: TileCoordinatesSerialized
}
export type TurnAction = ArmAction | BuildAction | MoveAction | WarAction
export type TurnActionInProgress =
	| ArmActionInProgress
	| BuildAction
	| MoveActionInProgress
	| WarAction
export const turnInProgressAtom = atom<TurnActionInProgress | null>({
	key: `turnInProgress`,
	default: null,
})
export const validWarDeclaratorsSelector = selector<TileCoordinatesSerialized[]>(
	{
		key: `validWarDeclarators`,
		get: ({ get }) => {
			const validWarDeclarators: TileCoordinatesSerialized[] = []
			const userKey = get(playerTurnSelector)
			if (userKey === null) return validWarDeclarators
			const turnAction = get(turnInProgressAtom)
			const isArming = turnAction?.type === `arm`
			if (isArming) return validWarDeclarators
			const isWarring =
				turnAction?.type === `war` && turnAction.attacker !== null
			if (isWarring) {
				validWarDeclarators.push(turnAction.attacker)
				return validWarDeclarators
			}
			const allOwnedTiles = get(ownedTilesSelector, userKey)
			for (const tileCoordinates of allOwnedTiles) {
				const tileCubeCount = get(tileCubeCountAtoms, tileCoordinates)
				if (tileCubeCount >= 4) {
					validWarDeclarators.push(tileCoordinates)
				}
			}
			return validWarDeclarators
		},
	},
)
export const validWarTargetsSelector = selector<TileCoordinatesSerialized[]>({
	key: `validWarTargets`,
	get: ({ get }) => {
		const validWarTargets: TileCoordinatesSerialized[] = []
		const userKey = get(playerTurnSelector)
		const turnAction = get(turnInProgressAtom)
		if (turnAction?.type !== `war`) return validWarTargets
		const attacker = turnAction.attacker
		if (!attacker) return validWarTargets
		const attackerAdjacentTiles = get(adjacentTilesSelector, attacker)
		const myTilesChecked = new Set<TileCoordinatesSerialized>()
		const myTilesUnchecked: TileCoordinatesSerialized[] = []
		for (const adjacentTile of attackerAdjacentTiles) {
			const adjacentOwner = get(tileOwnerAtoms, adjacentTile)
			if (adjacentOwner === userKey) {
				myTilesUnchecked.push(adjacentTile)
			}
			validWarTargets.push(adjacentTile)
		}
		while (myTilesUnchecked.length > 0) {
			const myTile = myTilesUnchecked.pop()!
			myTilesChecked.add(myTile)
			const adjacentTiles = get(adjacentTilesSelector, myTile)
			for (const adjacentTile of adjacentTiles) {
				const adjacentOwner = get(tileOwnerAtoms, adjacentTile)
				if (adjacentOwner === userKey && !myTilesChecked.has(adjacentTile)) {
					myTilesUnchecked.push(adjacentTile)
				}
			}
		}
		myTilesChecked.delete(attacker)
		validWarTargets.push(...myTilesChecked)
		return validWarTargets
	},
})

export type TileStatus =
	| `isInvader`
	| `isMovingFromHere`
	| `isMovingToHere`
	| `mayBeInvaded`
	| `mayBeMoved`
	| `mayInvade`
export const tileStatusSelectors = selectorFamily<
	TileStatus | null,
	TileCoordinatesSerialized
>({
	key: `tileStatus`,
	get:
		(coords) =>
		({ get }) => {
			const turnInProgress = get(turnInProgressAtom)
			if (turnInProgress?.type === `war` && turnInProgress.attacker === coords) {
				return `isInvader`
			}
			const validWarDeclarators = get(validWarDeclaratorsSelector)
			if (validWarDeclarators.includes(coords)) {
				return `mayInvade`
			}

			const validWarTargets = get(validWarTargetsSelector)
			if (validWarTargets.includes(coords)) {
				return `mayBeInvaded`
			}

			if (turnInProgress?.type === `move`) {
				if (turnInProgress.origin === coords) return `isMovingFromHere`
				if (turnInProgress.target === coords) return `isMovingToHere`
			}
			if (turnInProgress !== null) return null

			const validDeclarators = get(validWarDeclaratorsSelector)
			if (validDeclarators.length > 0) return null

			const playerTurn = get(playerTurnSelector)
			if (playerTurn === null) return null

			const playerTilesRemaining = get(playerRemainingTilesAtoms, playerTurn)
			if (playerTilesRemaining > 0) return null

			const ownerOfTile = get(tileOwnerAtoms, coords)
			if (ownerOfTile !== playerTurn) return null

			const tileHeight = get(gameTilesStackHeightAtoms, coords)
			if (tileHeight !== 1) return null

			const adjacentTiles = get(adjacentTilesSelector, coords)
			if (adjacentTiles.length >= 5) return null
			const tileIsStructural = get(tileIsStructuralSelectors, coords)
			if (tileIsStructural) return null

			return `mayBeMoved`
		},
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

export const PLAYER_COLORS = [
	`#f46`,
	`#f96`,
	`#fe0`,
	`#5a6`,
	`#5af`,
	`#a7e`,
] as const
export type PlayerColor = (typeof PLAYER_COLORS)[number]
export const PLAYER_COLOR_DISPLAY_NAMES = {
	[`#f46`]: `Red`,
	[`#f96`]: `Orange`,
	[`#fe0`]: `Yellow`,
	[`#5a6`]: `Green`,
	[`#5af`]: `Blue`,
	[`#a7e`]: `Purple`,
} as const satisfies Record<PlayerColor, string>
export const playerColorAtoms = atomFamily<PlayerColor | null, UserKey>({
	key: `playerColor`,
	default: null,
})
export const colorsChosenSelector = selector<Set<PlayerColor>>({
	key: `colorsChosen`,
	get: ({ get }) => {
		const chosen = new Set<PlayerColor>()
		const turnOrder = get(playerTurnOrderAtom)
		for (const userKey of turnOrder) {
			const color = get(playerColorAtoms, userKey)
			if (color) chosen.add(color)
		}
		return chosen
	},
})

export const turnCanBeEndedSelector = selector<boolean>({
	key: `turnCanBeEnded`,
	get: ({ get }) => {
		const turnInProgress = get(turnInProgressAtom)
		switch (turnInProgress?.type) {
			case `build`:
			case undefined:
			case null:
				return false
			case `arm`:
				return turnInProgress.targets.length > 0
			case `move`:
				return turnInProgress.target !== null
			case `war`: {
				const gameTiles = get(gameTilesAtom)
				for (const tile of gameTiles) {
					const tileCubeCount = get(tileCubeCountAtoms, tile)
					if (tileCubeCount === 0) return false
				}
				return turnInProgress.targets.length > 0
			}
		}
	},
})

export function setWarTarget(
	currentTurn: UserKey | null,
	ownerKey: UserKey | null,
	stackHeight: TileStackHeight,
	warAction: WarAction,
	target: TileCoordinatesSerialized,
): void {
	let attackerDelta: number
	let targetDelta: number
	const targetIsMine = currentTurn === ownerKey
	if (targetIsMine) {
		attackerDelta = -1
		targetDelta = 1
	} else {
		const attackerStackHeight = getState(
			gameTilesStackHeightAtoms,
			warAction.attacker,
		)

		const feeAlreadyPaid = warAction.targets.includes(target)
		const entryFee = feeAlreadyPaid
			? 0
			: stackHeight > attackerStackHeight
				? stackHeight - attackerStackHeight
				: 0

		attackerDelta = -1 - entryFee
		targetDelta = -1
	}
	const attackerCubeCount = getState(tileCubeCountAtoms, warAction.attacker)
	if (attackerCubeCount + attackerDelta <= 0) {
		return
	}
	setState(turnInProgressAtom, {
		...warAction,
		targets: [...warAction.targets, target],
	})
	setState(
		tileCubeCountAtoms,
		target,
		(current) => (current + targetDelta) as TileCubeCount,
	)
	setState(
		tileCubeCountAtoms,
		warAction.attacker,
		(current) => (current + attackerDelta) as TileCubeCount,
	)
	const targetCubeCount = getState(tileCubeCountAtoms, target)
	if (targetCubeCount === 0) {
		const originalOwner = getState(tileOwnerAtoms, target)
		if (originalOwner !== null) {
			warAction.originalOwners[target] = originalOwner
		}
		setState(tileOwnerAtoms, target, currentTurn)
	}
}

export const playerRemainingTilesAtoms = atomFamily<number, UserKey>({
	key: `playerRemainingTiles`,
	default: 12,
})
export const playerRemainingCubesAtoms = atomFamily<number, UserKey>({
	key: `playerRemainingCubes`,
	default: 20,
})

const HEX_AXES = [`middle`, `double`, `final`] as const
type HexAxis = (typeof HEX_AXES)[number]

function getDirectionalAdjacent(
	axis: HexAxis,
	direction: `negative` | `positive`,
	coordinates: TileCoordinates,
): TileCoordinates {
	const [x, y, z] = coordinates
	switch (axis) {
		case `middle`:
			switch (direction) {
				case `positive`:
					return [x + 1, y, z - 1]
				case `negative`:
					return [x - 1, y, z + 1]
			}
			break
		case `double`:
			switch (direction) {
				case `positive`:
					return [x + 2, y - 1, z - 1]
				case `negative`:
					return [x - 2, y + 1, z + 1]
			}
			break
		case `final`:
			switch (direction) {
				case `positive`:
					return [x + 1, y - 1, z]
				case `negative`:
					return [x - 1, y + 1, z]
			}
	}
}

export const lineWinSelectors = selectorFamily<
	ReadonlySet<TileCoordinatesSerialized> | null,
	[axis: HexAxis, tile: TileCoordinatesSerialized]
>({
	key: `middleLineWin`,
	get:
		([axis, coordinatesSerialized]) =>
		({ get }) => {
			let coordinates = deserializeTileCoordinates(coordinatesSerialized)
			const ownerKey = get(tileOwnerAtoms, coordinatesSerialized)
			if (ownerKey === null) return null
			const tiles = new Set<TileCoordinatesSerialized>([coordinatesSerialized])
			while (true) {
				const adjacent = getDirectionalAdjacent(axis, `positive`, coordinates)
				const adjacentSerialized = serializeTileCoordinates(adjacent)
				const adjacentOwnerKey = get(tileOwnerAtoms, adjacentSerialized)
				if (adjacentOwnerKey !== ownerKey) break
				tiles.add(adjacentSerialized)
				coordinates = adjacent
			}
			if (tiles.size >= 6) return tiles
			return null
		},
})

export const ringWinSelectors = selectorFamily<
	ReadonlySet<TileCoordinatesSerialized> | null,
	TileCoordinatesSerialized
>({
	key: `ringWin`,
	get:
		(coordinates0) =>
		({ get }) => {
			const coordinates = deserializeTileCoordinates(coordinates0)
			const ownerKey = get(tileOwnerAtoms, coordinates0)
			const [x, y, z] = coordinates
			const coordinates1 = serializeTileCoordinates([x + 2, y - 1, z - 1])
			const owner1 = get(tileOwnerAtoms, coordinates1)
			if (owner1 !== ownerKey) return null
			const coordinates2 = serializeTileCoordinates([x + 3, y - 2, z - 1])
			const owner2 = get(tileOwnerAtoms, coordinates2)
			if (owner2 !== ownerKey) return null
			const coordinates3 = serializeTileCoordinates([x + 2, y - 2, z])
			const owner3 = get(tileOwnerAtoms, coordinates3)
			if (owner3 !== ownerKey) return null
			const coordinates4 = serializeTileCoordinates([x, y - 1, z + 1])
			const owner4 = get(tileOwnerAtoms, coordinates4)
			if (owner4 !== ownerKey) return null
			const coordinates5 = serializeTileCoordinates([x - 1, y, z + 1])
			const owner5 = get(tileOwnerAtoms, coordinates5)
			if (owner5 !== ownerKey) return null
			const winningTiles = new Set([
				coordinates0,
				coordinates1,
				coordinates2,
				coordinates3,
				coordinates4,
				coordinates5,
			])
			return winningTiles
		},
})
export const triangleWinSelectors = selectorFamily<
	ReadonlySet<TileCoordinatesSerialized> | null,
	TileCoordinatesSerialized
>({
	key: `triangleWin`,
	get:
		(coordinates0) =>
		({ get }) => {
			const coordinates = deserializeTileCoordinates(coordinates0)
			const ownerKey = get(tileOwnerAtoms, coordinates0)
			const [x, y, z] = coordinates
			const coordinates1 = serializeTileCoordinates([x + 2, y - 1, z - 1])
			const owner1 = get(tileOwnerAtoms, coordinates1)
			if (owner1 !== ownerKey) return null
			const coordinates2 = serializeTileCoordinates([x + 1, y - 1, z])
			const owner2 = get(tileOwnerAtoms, coordinates2)
			if (owner2 !== ownerKey) return null
			const coordinates3 = serializeTileCoordinates([x, y - 1, z + 1])
			const owner3 = get(tileOwnerAtoms, coordinates3)
			if (owner3 !== ownerKey) return null
			const coordinates4 = serializeTileCoordinates([x - 1, y, z + 1])
			const owner4 = get(tileOwnerAtoms, coordinates4)
			if (owner4 !== ownerKey) return null
			const coordinates5 = serializeTileCoordinates([x - 2, y + 1, z + 1])
			const owner5 = get(tileOwnerAtoms, coordinates5)
			if (owner5 !== ownerKey) return null
			const winningTiles = new Set([
				coordinates0,
				coordinates1,
				coordinates2,
				coordinates3,
				coordinates4,
				coordinates5,
			])
			return winningTiles
		},
})

export const tilesByOwnerSelector = selector<
	Record<UserKey, TileCoordinatesSerialized[]>
>({
	key: `tilesByOwner`,
	get: ({ get }) => {
		const tiles = get(gameTilesAtom)
		const tilesByOwner: Record<UserKey, TileCoordinatesSerialized[]> = {}
		for (const tile of tiles) {
			const owner = get(tileOwnerAtoms, tile)
			if (owner === null) continue
			const tilesOwned = (tilesByOwner[owner] ??= [])
			tilesOwned.push(tile)
		}
		return tilesByOwner
	},
})

export const playerWinningTilesSelectors = selectorFamily<
	ReadonlySet<TileCoordinatesSerialized> | null,
	UserKey
>({
	key: `playerWinningTiles`,
	get:
		(userKey) =>
		({ get }) => {
			const tilesByOwner = get(tilesByOwnerSelector)
			const userOwnedTiles = tilesByOwner[userKey] ?? []
			for (const tile of userOwnedTiles) {
				for (const axis of HEX_AXES) {
					const lineWin = get(lineWinSelectors, [axis, tile])
					if (lineWin !== null) return lineWin
				}
				const ringWin = get(ringWinSelectors, tile)
				if (ringWin !== null) return ringWin
				const triangleWin = get(triangleWinSelectors, tile)
				if (triangleWin !== null) return triangleWin
			}
			return null
		},
})

export const winningTilesSelector =
	selector<ReadonlySet<TileCoordinatesSerialized> | null>({
		key: `winningTiles`,
		get: ({ get }) => {
			const players = get(playerTurnOrderAtom)
			for (const userKey of players) {
				const playerDidWin = get(playerWinningTilesSelectors, userKey)
				if (playerDidWin !== null) return playerDidWin
			}
			return null
		},
	})
