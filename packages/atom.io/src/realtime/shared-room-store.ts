import type {
	JoinToken,
	MutableAtomToken,
	ReadonlyPureSelectorFamilyToken,
} from "atom.io"
import { atom, getInternalRelations, join, selectorFamily } from "atom.io"
import type { SetRTXJson } from "atom.io/transceivers/set-rtx"
import { SetRTX } from "atom.io/transceivers/set-rtx"

export const usersInThisRoomIndex: MutableAtomToken<
	SetRTX<string>,
	SetRTXJson<string>
> = atom<SetRTX<string>, SetRTXJson<string>>({
	key: `usersInRoomIndex`,
	mutable: true,
	default: () => new SetRTX<string>(),
	toJson: (set) => set.toJSON(),
	fromJson: (json) => SetRTX.fromJSON(json),
})

export const roomIndex: MutableAtomToken<
	SetRTX<string>,
	SetRTXJson<string>
> = atom<SetRTX<string>, SetRTXJson<string>>({
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
export const usersInRooms: JoinToken<
	`room`,
	string,
	`user`,
	string,
	`1:n`,
	UserInRoomMeta
> = join(
	{
		key: `usersInRooms`,
		between: [`room`, `user`],
		cardinality: `1:n`,
		isAType: (input): input is string => typeof input === `string`,
		isBType: (input): input is string => typeof input === `string`,
	},
	DEFAULT_USER_IN_ROOM_META,
)

export const usersInMyRoomView: ReadonlyPureSelectorFamilyToken<
	MutableAtomToken<SetRTX<string>, SetRTXJson<string>>[],
	string
> = selectorFamily<
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
