import { transaction } from "atom.io"
import { trickIndex, trickStates } from "../card-game-stores"

export const spawnTrickTX = transaction<(trickId: string) => void>({
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
