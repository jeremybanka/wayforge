import * as AtomIO from "atom.io"
import { myIdState } from "atom.io/realtime-client"

import { playersInRooms } from "~/apps/core.wayfarer.quest/src/store/rooms"

export const myRoomState = AtomIO.selector<string | null>({
	key: `myRoom`,
	get: ({ get }) => {
		const myId = get(myIdState)
		return myId ? get(playersInRooms.states.roomKeyOfPlayer(myId)) ?? null : null
	},
})
