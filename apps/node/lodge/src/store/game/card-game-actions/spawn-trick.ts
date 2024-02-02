import { transaction } from "atom.io"

import * as CardGroups from "../card-game-stores/card-groups-store"

export const spawnTrickTX = transaction<(trickId: string) => void>({
	key: `spawnTrick`,
	do: (transactors, trickId) => {
		const { set, find } = transactors
		const trickState = find(CardGroups.trickStates, trickId)
		set(trickState, { type: `trick`, name: `` })
		set(CardGroups.trickIndex, (current) => {
			const next = current.add(trickId)
			return next
		})
	},
})
