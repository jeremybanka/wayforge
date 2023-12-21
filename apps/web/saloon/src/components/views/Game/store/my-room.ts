import * as AtomIO from "atom.io"
import { myIdState } from "atom.io/realtime-client"

import { playersInRooms } from "~/apps/node/lodge/src/store/rooms"

export const myRoomState = AtomIO.selector<string | null>({
	key: `myRoom`,
	get: ({ get }) => {
		const myId = get(myIdState)
		return myId
			? get(playersInRooms.findState.roomKeyOfPlayer(myId)) ?? null
			: null
	},
})
