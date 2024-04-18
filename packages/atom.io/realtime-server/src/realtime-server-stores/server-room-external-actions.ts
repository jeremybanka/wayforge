import * as AtomIO from "atom.io"
import { editRelations, editRelationsInStore, type Loadable } from "atom.io/data"
import type { UserInRoomMeta } from "atom.io/realtime"
import { roomIndex, usersInRooms } from "atom.io/realtime"

import type { ChildSocket } from "../ipc-sockets"
import type { RoomArguments } from "./server-room-external-store"
import { roomArgumentsAtoms, roomSelectors } from "./server-room-external-store"

export const createRoomTX = AtomIO.transaction<
	(
		roomId: string,
		script: string,
		options?: string[],
	) => Loadable<ChildSocket<any, any>>
>({
	key: `createRoom`,
	do: ({ get, set, find }, roomId, script, options) => {
		const args: RoomArguments = options ? [script, options] : [script]
		const roomArgumentsState = find(roomArgumentsAtoms, roomId)
		set(roomArgumentsState, args)
		set(roomIndex, (s) => s.add(roomId))
		const roomState = find(roomSelectors, roomId)
		const room = get(roomState)
		return room
	},
})
export type CreateRoomIO = AtomIO.TransactionIO<typeof createRoomTX>

export const joinRoomTX = AtomIO.transaction<
	(roomId: string, userId: string, enteredAtEpoch: number) => UserInRoomMeta
>({
	key: `joinRoom`,
	do: (transactors, roomId, userId, enteredAtEpoch) => {
		const meta = { enteredAtEpoch }
		editRelationsInStore(
			usersInRooms,
			(relations) => {
				relations.set({ room: roomId, user: userId }, meta)
			},
			transactors.env().store,
		)
		return meta
	},
})
export type JoinRoomIO = AtomIO.TransactionIO<typeof joinRoomTX>

export const leaveRoomTX = AtomIO.transaction<
	(roomId: string, userId: string) => void
>({
	key: `leaveRoom`,
	do: (transactors, roomId, userId) => {
		editRelationsInStore(
			usersInRooms,
			(relations) => {
				relations.delete({ room: roomId, user: userId })
			},
			transactors.env().store,
		)
	},
})
export type LeaveRoomIO = AtomIO.TransactionIO<typeof leaveRoomTX>

export const destroyRoomTX = AtomIO.transaction<(roomId: string) => void>({
	key: `destroyRoom`,
	do: (transactors, roomId) => {
		editRelationsInStore(
			usersInRooms,
			(relations) => {
				relations.delete({ room: roomId })
			},
			transactors.env().store,
		)
		transactors.set(roomIndex, (s) => (s.delete(roomId), s))
	},
})
