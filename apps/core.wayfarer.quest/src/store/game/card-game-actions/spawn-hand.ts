import { transaction } from "atom.io"
import { editRelations } from "atom.io/data"

import * as CardGroups from "../card-game-stores/card-groups-store"
import { gamePlayerIndex } from "../card-game-stores/game-players-store"

export const spawnHandTX = transaction<
	(playerId: string, handKey: CardGroups.HandKey) => void
>({
	key: `spawnHand`,
	do: (transactors, playerId, handKey) => {
		const { get, set, find } = transactors
		const playerIds = get(gamePlayerIndex)
		if (!playerIds.includes(playerId)) {
			return
		}
		const handState = find(CardGroups.handAtoms, handKey)
		set(handState, {
			type: `hand`,
			name: ``,
		})
		set(CardGroups.handIndex, (current) => {
			const next = current.add(handKey)
			return next
		})
		editRelations(CardGroups.ownersOfGroups, (relations) => {
			relations.set({ player: playerId, group: handKey })
		})
	},
})
