import { findRelations, selectorFamily } from "atom.io"
import type { UserKey } from "atom.io/realtime"

import type { HandKey } from "../../../../../library/game-systems/card-game-stores"
import {
	isHandKey,
	ownersOfCollections,
} from "../../../../../library/game-systems/card-game-stores"

export const handsOfPlayerSelectors = selectorFamily<
	readonly HandKey[],
	UserKey
>({
	key: `handsOfPlayer`,
	get:
		(userKey) =>
		({ get }) =>
			get(
				findRelations(ownersOfCollections, userKey).collectionKeysOfOwner,
			).filter(isHandKey),
})
