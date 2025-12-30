import { atom, selector } from "atom.io"
import { myUserKeyAtom } from "atom.io/realtime-client"
import { RealtimeContext } from "atom.io/realtime-react"
import React from "react"
import type { Socket } from "socket.io-client"
import type * as THREE from "three"

import type { PlayerActions } from "../../../../library/bug-rangers-game-state"
import {
	playerColorAtoms,
	playerRemainingTilesAtoms,
	playerTurnSelector,
	turnInProgressAtom,
	validWarDeclaratorsSelector,
} from "../../../../library/bug-rangers-game-state"

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
				return `toMove`
			case null:
			case undefined: {
				const myUserKey = get(myUserKeyAtom)
				if (myUserKey === null) return false
				console.log(`😼`, { myUserKey })
				const validWarDeclarators = get(validWarDeclaratorsSelector)
				if (validWarDeclarators.length > 0) return false
				const myRemainingTiles = get(playerRemainingTilesAtoms, myUserKey)
				if (myRemainingTiles > 0) return `toBuild`
				return false
			}
		}
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
