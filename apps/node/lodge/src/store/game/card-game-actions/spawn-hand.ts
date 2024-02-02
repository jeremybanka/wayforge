import { transaction } from "atom.io"

import { playersInRooms } from "../../rooms"
import * as CardGroups from "../card-game-stores/card-groups-store"

export const spawnHandTX = transaction<
	(playerId: string, handId: string) => void
>({
	key: `spawnHand`,
	do: (transactors, playerId, handId) => {
		const { get, set, find } = transactors
		const gameId = get(find(playersInRooms.states.roomKeyOfPlayer, playerId))
		if (gameId === null) {
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
			relations.set({ player: playerId, group: handId })
		})
	},
})
