import { transaction } from "atom.io"
import { nanoid } from "nanoid"

import { TrickKey, trickKeysAtom } from "../card-game-stores"

export const spawnTrickTX = transaction<() => void>({
	key: `spawnTrick`,
	do: (transactors) => {
		const { set } = transactors
		const trickKey = TrickKey(nanoid)
		set(trickKeysAtom, (current) => {
			const next = current.add(trickKey)
			return next
		})
	},
})
