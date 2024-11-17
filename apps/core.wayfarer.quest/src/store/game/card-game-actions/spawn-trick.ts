import { transaction } from "atom.io"
import type { Actual } from "atom.io/realtime"
import type { UserKey } from "atom.io/realtime-server"

import type { TrickKey } from "../card-game-stores/trick-store"
import { trickIndex, trickStates } from "../card-game-stores/trick-store"

export const spawnTrickTX = transaction<
	(userKey: UserKey<Actual>, trickId: TrickKey) => void
>({
	key: `spawnTrick`,
	do: (transactors, _, trickId) => {
		const { set, find } = transactors
		const trickState = find(trickStates, trickId)
		set(trickState, { type: `trick`, name: `` })
		set(trickIndex, (current) => {
			const next = current.add(trickId)
			return next
		})
	},
})
