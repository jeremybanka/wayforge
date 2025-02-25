import { findRelations, selectorFamily } from "atom.io"

import { ownersOfGroups } from "~/apps/core.wayfarer.quest/src/store/game"

export const handsOfPlayerSelectors = selectorFamily<string[], string>({
	key: `handsOfPlayer`,
	get:
		(playerId) =>
		({ get }) =>
			get(findRelations(ownersOfGroups, playerId).groupKeysOfPlayer),
})
