import * as AtomIO from "atom.io"
import {
	type RoomKey,
	type SocketKey,
	type UserKey,
	usersInRooms,
} from "atom.io/realtime"

export const mySocketKeyAtom: AtomIO.RegularAtomToken<SocketKey | undefined> =
	AtomIO.atom<SocketKey | undefined>({
		key: `mySocketKey`,
		default: undefined,
	})

export const myUserKeyAtom: AtomIO.RegularAtomToken<UserKey | null> =
	AtomIO.atom<UserKey | null>({
		key: `myUserKey`,
		default: null,
		effects: [
			(userKey) => {
				if (typeof window !== `undefined`) {
					void import(`atom.io/web`).then(({ storageSync }) => {
						storageSync(globalThis.localStorage, JSON, `myUserKey`)(userKey)
					})
				}
			},
		],
	})

export const myRoomKeySelector: AtomIO.ReadonlyPureSelectorToken<RoomKey | null> =
	AtomIO.selector<RoomKey | null>({
		key: `myRoomKey`,
		get: ({ get }) => {
			if (
				`env` in globalThis &&
				`REALTIME_ROOM_KEY` in (globalThis as any).env
			) {
				// if a room running server-side wants its own key, this is where it lives
				return (globalThis as any).env[`REALTIME_ROOM_KEY`]
			}
			const myUserKey = get(myUserKeyAtom)
			if (!myUserKey) return null
			const [, usersInRoomsAtoms] = AtomIO.getInternalRelations(
				usersInRooms,
				`split`,
			)
			const roomKeys = get(usersInRoomsAtoms, myUserKey)
			for (const roomKey of roomKeys) {
				return roomKey
			}
		},
	})
