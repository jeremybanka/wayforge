import type {
	JoinToken,
	MutableAtomToken,
	PureSelectorFamilyToken,
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
	key: `roomKeys`,
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

export const visibleUsersInRoomsSelector: PureSelectorFamilyToken<
	[self: UserKey, ...RoomKey[]],
	UserKey
> = selectorFamily({
	key: `visibleUsersInRooms`,
	get:
		(userKey) =>
		({ get }) => {
			const [, roomsOfUsersAtoms] = getInternalRelations(usersInRooms, `split`)
			const rooms = get(roomsOfUsersAtoms, userKey)
			return [userKey, ...rooms]
		},
})

export const visibilityFromRoomSelector: PureSelectorFamilyToken<
	[self: RoomKey, ...UserKey[]],
	RoomKey
> = selectorFamily({
	key: `visibilityFromRoom`,
	get:
		(roomKey) =>
		({ get }) => {
			const [usersOfRoomsAtoms] = getInternalRelations(usersInRooms, `split`)
			const users = get(usersOfRoomsAtoms, roomKey)
			return [roomKey, ...users]
		},
})

export const mutualUsersSelector: ReadonlyPureSelectorFamilyToken<
	UserKey[],
	UserKey
> = selectorFamily({
	key: `mutualUsers`,
	get:
		(userKey) =>
		({ get }) => {
			const [usersOfRoomsAtoms, roomsOfUsersAtoms] = getInternalRelations(
				usersInRooms,
				`split`,
			)
			const rooms = get(roomsOfUsersAtoms, userKey)
			for (const room of rooms) {
				const users = get(usersOfRoomsAtoms, room)
				return [...users]
			}
			return [userKey]
		},
})

export const ownersOfRooms: JoinToken<`user`, UserKey, `room`, RoomKey, `1:n`> =
	join({
		key: `ownersOfRooms`,
		between: [`user`, `room`],
		cardinality: `1:n`,
		isAType: isUserKey,
		isBType: isRoomKey,
	})
