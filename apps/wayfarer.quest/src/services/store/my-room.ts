import * as AtomIO from "atom.io"
import { usersInRooms } from "atom.io/realtime"
import { myUsernameState } from "atom.io/realtime-client"
import { roomViewState } from "./room-view-state"

export const myRoomKeyState = AtomIO.selector<string | null>({
	key: `myRoomKey`,
	get: ({ get }) => {
		const roomView = get(roomViewState)
		const myUsername = get(myUsernameState)
		const myRoom =
			roomView && myUsername
				? get(usersInRooms.states.userKeysOfRoom(roomView))?.includes(myUsername)
					? roomView
					: null ?? null
				: null
		return myRoom
	},
})
