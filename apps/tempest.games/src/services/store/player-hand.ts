import { selectorFamily } from "atom.io"

import { ownersOfGroups } from "~/apps/node/lodge/src/store/game"

export const findHandsOfPlayer = selectorFamily<string[], string>({
	key: `findHandsOfPlayer`,
	get:
		(playerId) =>
		({ get }) =>
			get(ownersOfGroups.findState.groupKeysOfPlayer(playerId)),
})
