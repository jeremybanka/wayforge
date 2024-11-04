import { selectorFamily } from "atom.io"
import { findRelations } from "atom.io/data"

import type { HandKey } from "~/apps/core.wayfarer.quest/src/store/game/card-game-stores/card-groups-store"
import {
	isHandKey,
	ownersOfGroups,
} from "~/apps/core.wayfarer.quest/src/store/game/card-game-stores/card-groups-store"

export const handsOfPlayerSelectors = selectorFamily<HandKey[], string>({
	key: `handsOfPlayer`,
	get:
		(playerId) =>
		({ get }) =>
			get(findRelations(ownersOfGroups, playerId).groupKeysOfPlayer).filter(
				isHandKey,
			),
})
