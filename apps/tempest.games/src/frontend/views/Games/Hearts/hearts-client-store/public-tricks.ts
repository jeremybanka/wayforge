import { findRelations, selector } from "atom.io"
import { myRoomKeySelector, myUserKeyAtom } from "atom.io/realtime-client"

import type { TrickKey } from "~library/game-systems/card-game-state"
import { ownersOfCollections } from "~library/game-systems/card-game-state"
import { trickKeysAtom } from "~library/game-systems/trick-taker-game-state"

export const publicTrickSelector = selector<TrickKey[]>({
	key: `publicTrickKeys`,
	get: ({ get }) => {
		const publicTrickKeys: TrickKey[] = []
		const myUserKey = get(myUserKeyAtom)
		if (!myUserKey) {
			return publicTrickKeys
		}
		const myRoomKey = get(myRoomKeySelector)
		if (!myRoomKey) {
			return publicTrickKeys
		}
		const trickKeys = get(trickKeysAtom)
		for (const trickKey of trickKeys) {
			const ownerOfTrick = get(
				findRelations(ownersOfCollections, trickKey).ownerKeyOfCollection,
			)
			if (ownerOfTrick === null) {
				publicTrickKeys.push(trickKey)
			}
		}
		return publicTrickKeys
	},
})
