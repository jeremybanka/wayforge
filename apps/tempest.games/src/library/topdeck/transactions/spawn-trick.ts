import { transaction } from "atom.io"

import { trickKeysAtom, trickStates } from "../card-game-stores"

export const spawnTrickTX = transaction<(trickId: string) => void>({
	key: `spawnTrick`,
	do: (transactors, trickId) => {
		const { set } = transactors
		set(trickStates, trickId, {
			type: `trick`,
			name: ``,
		})
		set(trickKeysAtom, (current) => {
			const next = current.add(trickId)
			return next
		})
	},
})
