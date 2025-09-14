import type {
	Hierarchy,
	JoinToken,
	MutableAtomToken,
	PureSelectorFamilyToken,
	RegularAtomFamilyToken,
} from "atom.io"
import { atomFamily, join, mutableAtom, selectorFamily } from "atom.io"
import { UList } from "atom.io/transceivers/u-list"

import type { Socket } from "atom.io/realtime"

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

export const socketIndex: MutableAtomToken<UList<SocketKey>> = mutableAtom<
	UList<SocketKey>
>({
	key: `socketsIndex`,
	class: UList,
})
export const userIndex: MutableAtomToken<UList<UserKey>> = mutableAtom<
	UList<UserKey>
>({
	key: `usersIndex`,
	class: UList,
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

export const userMutualSituationalAwarenessIndexes: PureSelectorFamilyToken<
	UserKey[],
	UserKey
> = selectorFamily<UserKey[], UserKey>({
	key: `userMutualSituationalAwarenessIndexes`,
	get: (userId) => () => {
		return [userId]
	},
})
