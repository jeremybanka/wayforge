import { transaction } from "atom.io"

import { handIndex, handStates, ownersOfGroups } from "../card-game-stores"

export const spawnHandTX = transaction<
	(playerId: string, handId: string) => void
>({
	key: `spawnHand`,
	do: (transactors, playerId, handId) => {
		const { set, find } = transactors
		const handState = find(handStates, handId)
		set(handState, {
			type: `hand`,
			name: ``,
		})
		set(handIndex, (current) => {
			const next = current.add(handId)
			return next
		})
		ownersOfGroups.transact(transactors, ({ relations }) => {
			relations.set({ player: playerId, group: handId })
		})
	},
})
