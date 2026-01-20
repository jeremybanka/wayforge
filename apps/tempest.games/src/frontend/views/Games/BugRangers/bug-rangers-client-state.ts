import { atom, selector } from "atom.io"
import { myUserKeyAtom } from "atom.io/realtime-client"
import { RealtimeContext } from "atom.io/realtime-react"
import React from "react"
import type { Socket } from "socket.io-client"
import type * as THREE from "three"

import type { PlayerActions } from "../../../../library/game-systems/bug-rangers-game-state"
import {
	gameTilesAtom,
	maximumStackHeightSelectors,
	playerColorAtoms,
	playerRemainingCubesAtoms,
	playerRemainingTilesAtoms,
	tileOwnerAtoms,
	turnInProgressAtom,
	validWarDeclaratorsSelector,
} from "../../../../library/game-systems/bug-rangers-game-state"
import { playerTurnSelector } from "../../../../library/game-systems/turn-based-game-state"

export function usePlayerActions(): Socket<{}, PlayerActions> {
	const { socket } = React.useContext(RealtimeContext)
	return socket as Socket<{}, PlayerActions>
}

export const cameraTargetAtom = atom<[x: number, y: number, z: number]>({
	key: `cameraTarget`,
	default: [0, 0, 0],
})

export const controlsEnabledAtom = atom<boolean>({
	key: `controlsEnabled`,
	default: true,
})

export const cameraAnchoredSphereAtom = atom<THREE.Mesh | null>({
	key: `cameraAnchoredSphere`,
	default: null,
})

export const isMyTurnSelector = selector<boolean>({
	key: `isMyTurn`,
	get: ({ get }) => {
		const playerTurn = get(playerTurnSelector)
		const myUserKey = get(myUserKeyAtom)
		return playerTurn === myUserKey
	},
})

export const iAmReadyToPlaySelector = selector<boolean>({
	key: `iAmReadyToPlay`,
	get: ({ get }) => {
		const myUserKey = get(myUserKeyAtom)
		if (myUserKey === null) return false
		const myColor = get(playerColorAtoms, myUserKey)
		if (myColor === null) return false
		const isMyTurn = get(isMyTurnSelector)
		return isMyTurn
	},
})

export const playableZonesVisibleSelector = selector<
	`toBuild` | `toMove` | false
>({
	key: `playableZonesVisible`,
	get: ({ get }) => {
		const iAmReadyToPlay = get(iAmReadyToPlaySelector)
		if (!iAmReadyToPlay) return false
		const turnInProgress = get(turnInProgressAtom)
		switch (turnInProgress?.type) {
			case `arm`:
			case `build`:
			case `war`:
				return false
			case `move`:
				{
					if (turnInProgress.target === null) return `toMove`
				}
				break
			case null:
			case undefined: {
				const myUserKey = get(myUserKeyAtom)
				if (myUserKey === null) return false
				const validWarDeclarators = get(validWarDeclaratorsSelector)
				if (validWarDeclarators.length > 0) return false
				const myRemainingTiles = get(playerRemainingTilesAtoms, myUserKey)
				if (myRemainingTiles > 0) return `toBuild`
			}
		}
		return false
	},
})

export const playerToolsVisibleSelector = selector<boolean>({
	key: `playerToolsVisible`,
	get: ({ get }) => {
		const iAmReadyToPlay = get(iAmReadyToPlaySelector)
		if (!iAmReadyToPlay) return false
		const validWarDeclarators = get(validWarDeclaratorsSelector)
		return validWarDeclarators.length <= 0
	},
})

export const mayPlaceTileSelector = selector<boolean>({
	key: `mayPlaceTile`,
	get: ({ get }) => {
		const myUserKey = get(myUserKeyAtom)
		if (myUserKey === null) return false
		const myRemainingTiles = get(playerRemainingTilesAtoms, myUserKey)
		if (myRemainingTiles <= 0) return false
		const turnInProgress = get(turnInProgressAtom)
		switch (turnInProgress?.type) {
			case undefined:
				return true
			case `arm`:
			case `move`:
			case `war`:
				return false
			case `build`: {
				const { count } = turnInProgress
				const maximumStackHeight = get(maximumStackHeightSelectors, [
					turnInProgress.target,
					myUserKey,
				])
				return count < maximumStackHeight
			}
		}
	},
})

export const mayPlaceCubeSelector = selector<boolean>({
	key: `mayPlaceCube`,
	get: ({ get }) => {
		const myUserKey = get(myUserKeyAtom)
		if (myUserKey === null) return false
		const myRemainingCubes = get(playerRemainingCubesAtoms, myUserKey)
		if (myRemainingCubes <= 0) return false
		const turnInProgress = get(turnInProgressAtom)
		switch (turnInProgress?.type) {
			case `move`:
			case `war`:
				return false
			case undefined: {
				const gameTiles = get(gameTilesAtom)
				for (const tile of gameTiles) {
					const owner = get(tileOwnerAtoms, tile)
					if (owner === myUserKey) return true
				}
				return false
			}
			case `arm`: {
				const { targets } = turnInProgress
				if (targets.length < 2) return true
				return false
			}
			case `build`: {
				const { count } = turnInProgress
				return count >= 1
			}
		}
	},
})
