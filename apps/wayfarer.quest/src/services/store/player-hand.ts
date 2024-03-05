import { selectorFamily } from "atom.io"
import { findRelations } from "atom.io/data"

import { ownersOfGroups } from "~/apps/core.wayfarer.quest/src/store/game"

export const findHandsOfPlayer = selectorFamily<string[], string>({
	key: `findHandsOfPlayer`,
	get:
		(playerId) =>
		({ get }) =>
			get(findRelations(ownersOfGroups, playerId).groupKeysOfPlayer),
})
