import { atom } from "atom.io"
import type { SetRTXJson } from "atom.io/transceivers/set-rtx"
import { SetRTX } from "atom.io/transceivers/set-rtx"

export const usersInThisRoomIndex = atom<SetRTX<string>, SetRTXJson<string>>({
	key: `usersInRoomIndex`,
	mutable: true,
	default: () => new SetRTX<string>(),
	toJson: (set) => set.toJSON(),
	fromJson: (json) => SetRTX.fromJSON(json),
})
