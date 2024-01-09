import { transaction } from "atom.io"

import { playersInRooms } from "../../rooms"
import * as CardGroups from "../card-groups"

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
		set(CardGroups.handStates(handId), {
			type: `hand`,
			name: ``,
		})
		const handIndex = find(CardGroups.handIndices, gameId)
		set(handIndex, (current) => {
			const next = current.add(handId)
			return next
		})
		CardGroups.ownersOfGroups.transact(transactors, ({ relations }) => {
			relations.set({ player: playerId, group: handId })
		})
	},
})
