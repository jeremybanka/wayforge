import type { Loadable } from "atom.io"
import * as AtomIO from "atom.io"
import { editRelationsInStore } from "atom.io/internal"
import type { UserInRoomMeta } from "atom.io/realtime"
import { roomIndex, usersInRooms } from "atom.io/realtime"

import type { ChildSocket } from "../ipc-sockets"
import type { RoomArguments } from "./server-room-external-store"
import { roomArgumentsAtoms, roomSelectors } from "./server-room-external-store"
import type { RoomKey } from "./server-user-store"

// export const createRoomTX: AtomIO.TransactionToken<
// 	(
// 		roomKey: RoomKey,
// 		script: string,
// 		options?: string[],
// 	) => Loadable<ChildSocket<any, any>>
// > = AtomIO.transaction({
// 	key: `createRoom`,
// 	do: ({ get, set, find }, roomId, script, options) => {
// 		const args: RoomArguments = options ? [script, options] : [script]
// 		const roomArgumentsState = find(roomArgumentsAtoms, roomId)
// 		set(roomArgumentsState, args)
// 		set(roomIndex, (s) => s.add(roomId))
// 		const roomState = find(roomSelectors, roomId)
// 		const room = get(roomState)
// 		return room
// 	},
// })
// export type CreateRoomIO = AtomIO.TransactionIO<typeof createRoomTX>

export const joinRoomTX: AtomIO.TransactionToken<
	(roomId: string, userId: string, enteredAtEpoch: number) => UserInRoomMeta
> = AtomIO.transaction({
	key: `joinRoom`,
	do: (tools, roomId, userId, enteredAtEpoch) => {
		const meta = { enteredAtEpoch }
		editRelationsInStore(
			usersInRooms,
			(relations) => {
				relations.set({ room: roomId, user: userId }, meta)
			},
			tools.env().store,
		)
		return meta
	},
})
export type JoinRoomIO = AtomIO.TransactionIO<typeof joinRoomTX>

export const leaveRoomTX: AtomIO.TransactionToken<
	(roomId: string, userId: string) => void
> = AtomIO.transaction({
	key: `leaveRoom`,
	do: (tools, roomId, userId) => {
		editRelationsInStore(
			usersInRooms,
			(relations) => {
				relations.delete({ room: roomId, user: userId })
			},
			tools.env().store,
		)
	},
})
export type LeaveRoomIO = AtomIO.TransactionIO<typeof leaveRoomTX>

export const destroyRoomTX: AtomIO.TransactionToken<(roomKey: RoomKey) => void> =
	AtomIO.transaction({
		key: `destroyRoom`,
		do: (tools, roomKey) => {
			editRelationsInStore(
				usersInRooms,
				(relations) => {
					relations.delete({ room: roomKey })
				},
				tools.env().store,
			)
			tools.set(roomIndex, (s) => (s.delete(roomKey), s))
		},
	})
