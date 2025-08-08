import type {
	Hierarchy,
	JoinToken,
	MutableAtomToken,
	RegularAtomFamilyToken,
} from "atom.io"
import { atomFamily, join, mutableAtom } from "atom.io"
import { SetRTX } from "atom.io/transceivers/set-rtx"

import type { Socket } from ".."

export type SocketKey = `socket::${string}`
export type UserKey = `user::${string}`
export type RoomKey = `room::${string}`

export type SocketSystemHierarchy = Hierarchy<
	[
		{
			above: `root`
			below: [UserKey, SocketKey, RoomKey]
		},
	]
>

export const socketAtoms: RegularAtomFamilyToken<Socket | null, SocketKey> =
	atomFamily<Socket | null, SocketKey>({
		key: `sockets`,
		default: null,
	})

export const socketIndex: MutableAtomToken<SetRTX<SocketKey>> = mutableAtom({
	key: `socketsIndex`,
	class: SetRTX,
})
export const userIndex: MutableAtomToken<SetRTX<UserKey>> = mutableAtom({
	key: `usersIndex`,
	class: SetRTX,
})
export const usersOfSockets: JoinToken<
	`user`,
	UserKey,
	`socket`,
	SocketKey,
	`1:1`
> = join({
	key: `usersOfSockets`,
	between: [`user`, `socket`],
	cardinality: `1:1`,
	isAType: (s): s is UserKey => s.startsWith(`user::`),
	isBType: (s): s is SocketKey => s.startsWith(`socket::`),
})
