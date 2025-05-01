import type {
	Hierarchy,
	JoinToken,
	MutableAtomToken,
	RegularAtomFamilyToken,
} from "atom.io"
import { atom, atomFamily, join } from "atom.io"
import type { SetRTXJson } from "atom.io/transceivers/set-rtx"
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
	atomFamily({
		key: `sockets`,
		default: null,
	})

export const socketIndex: MutableAtomToken<
	SetRTX<SocketKey>,
	SetRTXJson<SocketKey>
> = atom({
	key: `socketsIndex`,
	mutable: true,
	default: () => new SetRTX(),
	toJson: (set) => set.toJSON(),
	fromJson: (json) => SetRTX.fromJSON(json),
})
export const userIndex: MutableAtomToken<
	SetRTX<UserKey>,
	SetRTXJson<UserKey>
> = atom({
	key: `usersIndex`,
	mutable: true,
	default: () => new SetRTX(),
	toJson: (set) => set.toJSON(),
	fromJson: (json) => SetRTX.fromJSON(json),
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
