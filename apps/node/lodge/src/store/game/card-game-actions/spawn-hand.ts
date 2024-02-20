import { transaction } from "atom.io"

import { gamePlayerIndex } from "../card-game-stores"
import * as CardGroups from "../card-game-stores/card-groups-store"

export const spawnHandTX = transaction<
	(playerId: string, handId: string) => void
>({
	key: `spawnHand`,
	do: (transactors, playerId, handId) => {
		const { get, set, find } = transactors
		const playerIds = get(gamePlayerIndex)
		if (!playerIds.includes(playerId)) {
			return
		}
		const handState = find(CardGroups.handAtoms, handId)
		set(handState, {
			type: `hand`,
			name: ``,
		})
		set(CardGroups.handIndex, (current) => {
			const next = current.add(handId)
			return next
		})
		CardGroups.ownersOfGroups.transact(transactors, ({ relations }) => {
			relations.set({ player: playerId, group: handId })
		})
	},
})
