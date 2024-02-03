import * as AtomIO from "atom.io"
import { myUsernameState } from "atom.io/realtime-client"

import { gamePlayerIndex } from "~/apps/node/lodge/src/store/game"
import { myRoomKeyState } from "./my-room"

export const otherPlayersIndex = AtomIO.selector<string[]>({
	key: `otherPlayersIndex`,
	get: ({ get }) => {
		const myUsername = get(myUsernameState)
		if (!myUsername) {
			return []
		}
		const myRoomId = get(myRoomKeyState)
		if (myRoomId === null) {
			return []
		}
		const playerIdsInMyRoom = get(gamePlayerIndex)
		const everyoneButMe = playerIdsInMyRoom.filter((id) => id !== myUsername)
		return everyoneButMe
	},
})
