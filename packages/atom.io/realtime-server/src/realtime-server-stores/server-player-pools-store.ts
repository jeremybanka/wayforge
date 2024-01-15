import { atom } from "atom.io"
import { join } from "atom.io/data"
import { SetRTX } from "atom.io/transceivers/set-rtx"

export const roomsIndex = atom({
	key: `roomsIndex`,
	default: () => new SetRTX<string>(),
	mutable: true,
	toJson: (set) => set.toJSON(),
	fromJson: (json) => SetRTX.fromJSON(json),
})

export const clientsIndex = atom({
	key: `clientsIndex`,
	mutable: true,
	default: () => new SetRTX<string>(),
	toJson: (set) => set.toJSON(),
	fromJson: (json) => SetRTX.fromJSON(json),
})

export const DEFAULT_CLIENT_ROOM_CONTENT: {
	enteredAtEpoch: number
} = {
	enteredAtEpoch: 0,
}
export const clientsInRooms = join(
	{
		key: `clientsInRooms`,
		between: [`room`, `client`],
		cardinality: `1:n`,
	},
	DEFAULT_CLIENT_ROOM_CONTENT,
)
