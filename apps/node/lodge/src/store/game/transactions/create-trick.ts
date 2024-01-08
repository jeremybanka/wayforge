import { transaction } from "atom.io"

import * as CardGroups from "../card-groups"

export const createTrickTX = transaction<
	(gameId: string, trickId: string) => void
>({
	key: `createTrick`,
	do: (transactors, gameId, trickId) => {
		const { set, find } = transactors
		set(CardGroups.trickStates(trickId), {
			type: `trick`,
			name: ``,
		})
		const trickIndex = find(CardGroups.trickIndices, gameId)
		set(trickIndex, (current) => {
			const next = current.add(trickId)
			return next
		})
	},
})
