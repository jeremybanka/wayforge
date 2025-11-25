import type {
	JoinToken,
	MutableAtomToken,
	ReadonlyPureSelectorFamilyToken,
} from "atom.io"
import { getInternalRelations, join, mutableAtom, selectorFamily } from "atom.io"
import { UList } from "atom.io/transceivers/u-list"

import {
	isRoomKey,
	isUserKey,
	type RoomKey,
	type UserKey,
} from "./realtime-key-types"

export type RoomSocketInterface<RoomNames extends string> = {
	createRoom: (roomName: RoomNames) => void
	joinRoom: (roomKey: RoomKey) => void
	deleteRoom: (roomKey: RoomKey) => void
	leaveRoom: () => void
	// [leaveRoom: `leaveRoom:${string}`]: () => void
}

export const roomKeysAtom: MutableAtomToken<UList<RoomKey>> = mutableAtom({
	key: `roomIndex`,
	class: UList,
})

export type UserInRoomMeta = {
	enteredAtEpoch: number
}
export const DEFAULT_USER_IN_ROOM_META: UserInRoomMeta = {
	enteredAtEpoch: 0,
}
export const usersInRooms: JoinToken<`room`, RoomKey, `user`, UserKey, `1:n`> =
	join({
		key: `usersInRooms`,
		between: [`room`, `user`],
		cardinality: `1:n`,
		isAType: isRoomKey,
		isBType: isUserKey,
	})

export const ownersOfRooms: JoinToken<`user`, UserKey, `room`, RoomKey, `1:n`> =
	join({
		key: `ownersOfRooms`,
		between: [`user`, `room`],
		cardinality: `1:n`,
		isAType: isUserKey,
		isBType: isRoomKey,
	})

export const usersInMyRoomView: ReadonlyPureSelectorFamilyToken<
	MutableAtomToken<UList<RoomKey>>[],
	UserKey
> = selectorFamily({
	key: `usersInMyRoomView`,
	get:
		(myUsername) =>
		({ find }) => {
			const [, roomsOfUsersAtoms] = getInternalRelations(usersInRooms, `split`)
			const myRoomIndex = find(roomsOfUsersAtoms, myUsername)
			return [myRoomIndex]
		},
})
