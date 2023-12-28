import type { TransactionIO } from "atom.io"
import { atom, atomFamily, selector, transaction } from "atom.io"
import { join } from "atom.io/data"
import { IMPLICIT, createMutableAtom } from "atom.io/internal"
import type { SetRTXJson } from "atom.io/transceivers/set-rtx"
import { SetRTX } from "atom.io/transceivers/set-rtx"
import { nanoid } from "nanoid"

export const roomsIndex = atom({
	key: `roomsIndex`,
	default: () => new SetRTX<string>(),
	mutable: true,
	toJson: (set) => set.toJSON(),
	fromJson: (json) => SetRTX.fromJSON(json),
})

export type Room = {
	id: string
	name: string
}
export const findRoomState = atomFamily<Room, string>({
	key: `findRoom`,
	default: { id: ``, name: `` },
})

export type Player = {
	id: string
	name: string
}
export const findPlayerState = atomFamily<Player, string>({
	key: `findPlayer`,
	default: {
		id: ``,
		name: ``,
	},
})
export const playersIndex = createMutableAtom<
	SetRTX<string>,
	SetRTXJson<string>
>(
	{
		key: `playersIndex::mutable`,
		mutable: true,
		default: () => new SetRTX<string>(),
		toJson: (set) => set.toJSON(),
		fromJson: (json) => SetRTX.fromJSON(json),
	},
	undefined,
	IMPLICIT.STORE,
)

export const DEFAULT_PLAYER_ROOM_CONTENT: {
	enteredAt: number
} = {
	enteredAt: 0,
}
export const playersInRooms = join(
	{
		key: `playersInRooms`,
		between: [`room`, `player`],
		cardinality: `1:n`,
	},
	DEFAULT_PLAYER_ROOM_CONTENT,
)

export const createRoomTX = transaction<(id?: string) => string>({
	key: `createRoom`,
	do: ({ set }, roomId = nanoid()) => {
		set(roomsIndex, (ids) => ids.add(roomId))
		return roomId
	},
})
export type CreateRoomIO = TransactionIO<typeof createRoomTX>

export const joinRoomTX = transaction<
	(options: { roomId: string; playerId: string }) => void
>({
	key: `joinRoom`,
	do: (transactors, { roomId, playerId }) => {
		playersInRooms.transact(transactors, ({ relations }) => {
			relations.set(
				{ room: roomId, player: playerId },
				{ enteredAt: Date.now() },
			)
		})
	},
})
export type JoinRoomIO = TransactionIO<typeof joinRoomTX>

export const leaveRoomTX = transaction<
	(options: { roomId: string; playerId: string }) => void
>({
	key: `leaveRoom`,
	do: (transactors, { roomId, playerId }) => {
		playersInRooms.transact(transactors, ({ relations }) => {
			relations.delete({ room: roomId, player: playerId })
		})
	},
})
export type LeaveRoomIO = TransactionIO<typeof leaveRoomTX>
