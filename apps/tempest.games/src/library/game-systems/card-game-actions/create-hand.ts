import { editRelations, transaction } from "atom.io"
import type { UserKey } from "atom.io/realtime"
import { nanoid } from "nanoid"

import { HandKey, handKeysAtom, ownersOfCollections } from "../card-game-stores"
import { playerTurnOrderAtom } from "../game-setup-turn-order-and-spectators"

export const createHandTX = transaction<(userKey: UserKey) => HandKey>({
	key: `createHand`,
	do: (transactors, userKey) => {
		const { get, set } = transactors
		const userKeys = get(playerTurnOrderAtom)
		if (!userKeys.includes(userKey)) {
			throw new Error(`${userKey} is not in the turn order`)
		}
		const handKey = HandKey(nanoid)
		set(handKeysAtom, (permanent) => {
			const next = permanent.add(handKey)
			return next
		})
		editRelations(ownersOfCollections, (relations) => {
			relations.set({ owner: userKey, collection: handKey })
		})
		return handKey
	},
})
