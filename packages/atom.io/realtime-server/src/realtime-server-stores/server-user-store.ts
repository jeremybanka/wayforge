import type { Hierarchy } from "atom.io"
import { atom, atomFamily } from "atom.io"
import { join } from "atom.io/data"
import type { Actual, Alias } from "atom.io/realtime"
import type { SetRTXJson } from "atom.io/transceivers/set-rtx"
import { SetRTX } from "atom.io/transceivers/set-rtx"

import type { Socket } from ".."

export type SocketKey = `socket::${string}`
export type UserKey<K extends Actual | Alias = Actual | Alias> = `user::${K}`
export const isUserKey = (key: string): key is UserKey =>
	key.startsWith(`user::`)
export type RoomKey = `room::${string}`
export const isRoomKey = (key: string): key is RoomKey =>
	key.startsWith(`room::`)

export type SocketSystemHierarchy = Hierarchy<
	[
		{
			above: `root`
			below: [UserKey, SocketKey, RoomKey]
		},
	]
>

export const socketAtoms = atomFamily<Socket | null, SocketKey>({
	key: `sockets`,
	default: null,
})

export const socketIndex = atom<SetRTX<SocketKey>, SetRTXJson<SocketKey>>({
	key: `socketsIndex`,
	mutable: true,
	default: () => new SetRTX(),
	toJson: (set) => set.toJSON(),
	fromJson: (json) => SetRTX.fromJSON(json),
})
export const userIndex = atom<SetRTX<UserKey>, SetRTXJson<UserKey>>({
	key: `usersIndex`,
	mutable: true,
	default: () => new SetRTX(),
	toJson: (set) => set.toJSON(),
	fromJson: (json) => SetRTX.fromJSON(json),
})
export const usersOfSockets = join({
	key: `usersOfSockets`,
	between: [`user`, `socket`],
	cardinality: `1:1`,
	isAType: (s): s is UserKey => s.startsWith(`user::`),
	isBType: (s): s is SocketKey => s.startsWith(`socket::`),
})
