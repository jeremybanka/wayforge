import * as AtomIO from "atom.io"
import { myIdState } from "atom.io/realtime-client"
import { usersInRooms } from "atom.io/realtime-server"

export const myRoomState = AtomIO.selector<string | null>({
	key: `myRoom`,
	get: ({ get }) => {
		const myId = get(myIdState)
		return myId ? get(usersInRooms.states.roomKeyOfUser(myId)) ?? null : null
	},
})
