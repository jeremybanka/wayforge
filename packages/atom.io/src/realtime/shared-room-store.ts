import type {
	JoinToken,
	MutableAtomToken,
	ReadonlyPureSelectorFamilyToken,
} from "atom.io"
import { getInternalRelations, join, mutableAtom, selectorFamily } from "atom.io"
import { SetRTX } from "atom.io/transceivers/set-rtx"

export const usersInThisRoomIndex: MutableAtomToken<SetRTX<string>> =
	mutableAtom<SetRTX<string>>({
		key: `usersInRoomIndex`,
		class: SetRTX,
	})

export const roomIndex: MutableAtomToken<SetRTX<string>> = mutableAtom<
	SetRTX<string>
>({
	key: `roomIndex`,
	class: SetRTX,
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
	MutableAtomToken<SetRTX<string>>[],
	string
> = selectorFamily<MutableAtomToken<SetRTX<string>>[], string>({
	key: `usersInMyRoomView`,
	get:
		(myUsername) =>
		({ find }) => {
			const usersInRoomsAtoms = getInternalRelations(usersInRooms)
			const myRoomIndex = find(usersInRoomsAtoms, myUsername)
			return [myRoomIndex]
		},
})
