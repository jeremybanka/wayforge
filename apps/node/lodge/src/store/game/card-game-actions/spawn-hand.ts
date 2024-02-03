import { transaction } from "atom.io"

import { usersInRooms } from "atom.io/realtime"
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
			console.error({ playerId }, `Player is not in a game`)
			return
		}
		const handState = find(CardGroups.handStates, handId)
		set(handState, {
			type: `hand`,
			name: ``,
		})
		set(CardGroups.handIndex, (current) => {
			const next = current.add(handId)
			return next
		})
		CardGroups.ownersOfGroups.transact(transactors, ({ relations }) => {
			console.error({ playerId, handId }, `Spawning hand`)
			relations.set({ player: playerId, group: handId })
		})
	},
})
