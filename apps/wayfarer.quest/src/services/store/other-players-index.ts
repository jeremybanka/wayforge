import * as AtomIO from "atom.io"
import { myUsernameState } from "atom.io/realtime-client"

import { gamePlayerIndex } from "~/apps/core.wayfarer.quest/src/store/game"

export const otherPlayersIndex = AtomIO.selector<string[]>({
	key: `otherPlayersIndex`,
	get: ({ get }) => {
		const myUsername = get(myUsernameState)
		if (!myUsername) {
			return []
		}

		const playerIds = get(gamePlayerIndex)
		const everyoneButMe = playerIds.filter((id) => id !== myUsername)
		return everyoneButMe
	},
})
