import { findRelations, selectorFamily } from "atom.io"

import { ownersOfGroups } from "../../../../../library/topdeck"

export const handsOfPlayerSelectors = selectorFamily<readonly string[], string>({
	key: `handsOfPlayer`,
	get:
		(playerId) =>
		({ get }) =>
			get(findRelations(ownersOfGroups, playerId).groupKeysOfPlayer),
})
