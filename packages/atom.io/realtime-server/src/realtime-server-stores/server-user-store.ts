import type { Hierarchy } from "atom.io"
import { atom, atomFamily } from "atom.io"
import { join } from "atom.io/data"
import type { SetRTXJson } from "atom.io/transceivers/set-rtx"
import { SetRTX } from "atom.io/transceivers/set-rtx"

import type { Socket } from ".."

export type SocketKey = [`socket`, string]
export type UserKey = [`user`, string]
export type RoomKey = [`room`, string]

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

export const socketIndex = atom<SetRTX<string>, SetRTXJson<string>>({
	key: `socketsIndex`,
	mutable: true,
	default: () => new SetRTX<string>(),
	toJson: (set) => set.toJSON(),
	fromJson: (json) => SetRTX.fromJSON(json),
})
export const userIndex = atom<SetRTX<string>, SetRTXJson<string>>({
	key: `usersIndex`,
	mutable: true,
	default: () => new SetRTX<string>(),
	toJson: (set) => set.toJSON(),
	fromJson: (json) => SetRTX.fromJSON(json),
})
export const usersOfSockets = join({
	key: `usersOfSockets`,
	between: [`user`, `socket`],
	cardinality: `1:1`,
})
