import type {
	Hierarchy,
	JoinToken,
	MutableAtomToken,
	PureSelectorFamilyToken,
	RegularAtomFamilyToken,
} from "atom.io"
import { atomFamily, join, mutableAtom, selectorFamily } from "atom.io"
import type { RoomKey, Socket, SocketKey, UserKey } from "atom.io/realtime"
import { isSocketKey, isUserKey } from "atom.io/realtime"
import { UList } from "atom.io/transceivers/u-list"

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

export const socketKeysAtom: MutableAtomToken<UList<SocketKey>> = mutableAtom({
	key: `socketsIndex`,
	class: UList,
})
export const userKeysAtom: MutableAtomToken<UList<UserKey>> = mutableAtom({
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
	isAType: isUserKey,
	isBType: isSocketKey,
})

export const selfListSelectors: PureSelectorFamilyToken<UserKey[], UserKey> =
	selectorFamily({
		key: `selfList`,
		get: (userKey) => () => [userKey],
	})

export const mySocketKeySelectors: PureSelectorFamilyToken<
	SocketKey[],
	SocketKey
> = selectorFamily({
	key: `mySocketKey`,
	get: (socketKey) => () => [socketKey],
})
