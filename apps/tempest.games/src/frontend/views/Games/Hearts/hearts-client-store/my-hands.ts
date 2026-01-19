import { findRelations, selector } from "atom.io"
import { myUserKeyAtom } from "atom.io/realtime-client"

import type { HandKey } from "../../../../../library/game-systems/card-game-stores"
import {
	handKeysAtom,
	isHandKey,
	ownersOfCollections,
} from "../../../../../library/game-systems/card-game-stores"

export const myHandsSelector = selector<HandKey[]>({
	key: `myHands`,
	get: ({ get }) => {
		const myHandKeys: HandKey[] = []
		const myUserKey = get(myUserKeyAtom)
		if (!myUserKey) {
			return myHandKeys
		}
		const myCollectionKeys = get(
			findRelations(ownersOfCollections, myUserKey).collectionKeysOfOwner,
		)
		const allHandKeys = get(handKeysAtom)
		for (const collectionKey of myCollectionKeys) {
			if (isHandKey(collectionKey) && allHandKeys.has(collectionKey)) {
				myHandKeys.push(collectionKey)
			}
		}
		return myHandKeys
	},
})
