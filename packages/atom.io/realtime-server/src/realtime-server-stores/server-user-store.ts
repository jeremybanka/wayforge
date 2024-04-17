import { atom, atomFamily } from "atom.io"
import { join } from "atom.io/data"
import type { SetRTXJson } from "atom.io/transceivers/set-rtx"
import { SetRTX } from "atom.io/transceivers/set-rtx"

import type { Socket } from ".."

export const socketAtoms = atomFamily<Socket | null, string>({
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
