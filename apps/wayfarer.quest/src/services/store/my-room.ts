import * as AtomIO from "atom.io"
import { findRelations } from "atom.io/data"
import { usersInRooms } from "atom.io/realtime"
import { myUsernameState } from "atom.io/realtime-client"

import { roomViewState } from "./room-view-state"

export const myRoomKeyState = AtomIO.selector<string | null>({
	key: `myRoomKey`,
	get: ({ get }) => {
		const roomView = get(roomViewState)
		const myUsername = get(myUsernameState)
		let myRoom: string | null = null
		if (roomView && myUsername) {
			const state = findRelations(usersInRooms, myUsername).roomKeyOfUser
			const myRoomKey = get(state)
			if (myRoomKey?.includes(myUsername)) {
				myRoom = roomView
			}
		}
		return myRoom
	},
})
