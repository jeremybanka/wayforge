import { selectorFamily } from "atom.io"

import { ownersOfGroups } from "~/apps/core.wayfarer.quest/src/store/game"

export const findHandsOfPlayer = selectorFamily<string[], string>({
	key: `findHandsOfPlayer`,
	get:
		(playerId) =>
		({ get }) =>
			get(ownersOfGroups.states.groupKeysOfPlayer(playerId)),
})
