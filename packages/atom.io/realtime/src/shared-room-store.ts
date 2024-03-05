import type { MutableAtomToken } from "atom.io"
import { atom, selectorFamily } from "atom.io"
import { getInternalRelations, join } from "atom.io/data"
import type { SetRTXJson } from "atom.io/transceivers/set-rtx"
import { SetRTX } from "atom.io/transceivers/set-rtx"

export const usersInThisRoomIndex = atom<SetRTX<string>, SetRTXJson<string>>({
	key: `usersInRoomIndex`,
	mutable: true,
	default: () => new SetRTX<string>(),
	toJson: (set) => set.toJSON(),
	fromJson: (json) => SetRTX.fromJSON(json),
})

export const roomIndex = atom({
	key: `roomIndex`,
	default: () => new SetRTX<string>(),
	mutable: true,
	toJson: (set) => set.toJSON(),
	fromJson: (json) => SetRTX.fromJSON(json),
})

export type UserInRoomMeta = {
	enteredAtEpoch: number
}
export const DEFAULT_USER_IN_ROOM_META: UserInRoomMeta = {
	enteredAtEpoch: 0,
}
export const usersInRooms = join(
	{
		key: `usersInRooms`,
		between: [`room`, `user`],
		cardinality: `1:n`,
	},
	DEFAULT_USER_IN_ROOM_META,
)

export const usersInMyRoomView = selectorFamily<
	MutableAtomToken<SetRTX<string>, SetRTXJson<string>>[],
	string
>({
	key: `usersInMyRoomView`,
	get:
		(myUsername) =>
		({ find }) => {
			const usersInRoomsAtoms = getInternalRelations(usersInRooms)
			const myRoomIndex = find(usersInRoomsAtoms, myUsername)
			return [myRoomIndex]
		},
})
