import { atom } from "atom.io"
import { join } from "atom.io/data"
import { SetRTX } from "atom.io/transceivers/set-rtx"

export const socketIndex = atom({
	key: `socketsIndex`,
	mutable: true,
	default: () => new SetRTX<string>(),
	toJson: (set) => set.toJSON(),
	fromJson: (json) => SetRTX.fromJSON(json),
})
export const userIndex = atom({
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
