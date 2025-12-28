import { atom, selector } from "atom.io"
import { myUserKeyAtom } from "atom.io/realtime-client"
import { RealtimeContext } from "atom.io/realtime-react"
import React from "react"
import type { Socket } from "socket.io-client"
import type * as THREE from "three"

import type { PlayerActions } from "../../../../library/bug-rangers-game-state"
import { playerTurnSelector } from "../../../../library/bug-rangers-game-state"

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
