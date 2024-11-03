import { transaction } from "atom.io"

import { trickIndex, type TrickKey, trickStates } from "../card-game-stores"

export const spawnTrickTX = transaction<(trickId: TrickKey) => void>({
	key: `spawnTrick`,
	do: (transactors, trickId) => {
		const { set, find } = transactors
		const trickState = find(trickStates, trickId)
		set(trickState, { type: `trick`, name: `` })
		set(trickIndex, (current) => {
			const next = current.add(trickId)
			return next
		})
	},
})
