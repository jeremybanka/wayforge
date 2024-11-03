import { selectorFamily } from "atom.io"
import { findRelations } from "atom.io/data"

import type { HandKey } from "~/apps/core.wayfarer.quest/src/store/game"
import {
	isHandKey,
	ownersOfGroups,
} from "~/apps/core.wayfarer.quest/src/store/game"

export const handsOfPlayerSelectors = selectorFamily<HandKey[], string>({
	key: `handsOfPlayer`,
	get:
		(playerId) =>
		({ get }) =>
			get(findRelations(ownersOfGroups, playerId).groupKeysOfPlayer).filter(
				isHandKey,
			),
})
