import { editRelations, transaction } from "atom.io"
import type { UserKey } from "atom.io/realtime"

import { playerTurnOrderAtom } from "../../bug-rangers-game-state"
import * as CardGroups from "../card-game-stores/card-groups-store"

export const spawnHandTX = transaction<
	(userKey: UserKey, handId: string) => void
>({
	key: `spawnHand`,
	do: (transactors, userKey, handId) => {
		const { get, set, find } = transactors
		const userKeys = get(playerTurnOrderAtom)
		if (!userKeys.includes(userKey)) {
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
		editRelations(CardGroups.ownersOfGroups, (relations) => {
			relations.set({ player: userKey, group: handId })
		})
	},
})
