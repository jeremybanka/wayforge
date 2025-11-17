import type {
	JoinToken,
	MutableAtomToken,
	ReadonlyPureSelectorFamilyToken,
} from "atom.io"
import { getInternalRelations, join, mutableAtom, selectorFamily } from "atom.io"
import { UList } from "atom.io/transceivers/u-list"

export type RoomSocketInterface<RoomNames extends string> = {
	createRoom: (roomName: RoomNames) => void
	joinRoom: (roomKey: string) => void
	[leaveRoom: `leaveRoom:${string}`]: () => void
	[deleteRoom: `deleteRoom:${string}`]: () => void
}

export const roomKeysAtom: MutableAtomToken<UList<string>> = mutableAtom<
	UList<string>
>({
	key: `roomIndex`,
	class: UList,
})

export type UserInRoomMeta = {
	enteredAtEpoch: number
}
export const DEFAULT_USER_IN_ROOM_META: UserInRoomMeta = {
	enteredAtEpoch: 0,
}
export const usersInRooms: JoinToken<`room`, string, `user`, string, `1:n`> =
	join({
		key: `usersInRooms`,
		between: [`room`, `user`],
		cardinality: `1:n`,
		isAType: (input): input is string => typeof input === `string`,
		isBType: (input): input is string => typeof input === `string`,
	})

export const usersInMyRoomView: ReadonlyPureSelectorFamilyToken<
	MutableAtomToken<UList<string>>[],
	string
> = selectorFamily<MutableAtomToken<UList<string>>[], string>({
	key: `usersInMyRoomView`,
	get:
		(myUsername) =>
		({ find }) => {
			const usersInRoomsAtoms = getInternalRelations(usersInRooms)
			const myRoomIndex = find(usersInRoomsAtoms, myUsername)
			return [myRoomIndex]
		},
})
