import type { ChildProcessWithoutNullStreams } from "node:child_process"
import { spawn } from "node:child_process"

import type { TransactionIO, TransactionToken } from "atom.io"
import { transaction } from "atom.io"
import { editRelationsInStore } from "atom.io/internal"
import type { UserInRoomMeta } from "atom.io/realtime"
import { roomIndex, usersInRooms } from "atom.io/realtime"

import { ChildSocket } from "../ipc-sockets"
import type { RoomKey } from "./server-user-store"

export const ROOMS: Map<
	string,
	ChildSocket<any, any, ChildProcessWithoutNullStreams>
> = new Map()

export async function spawnRoom(
	roomId: string,
	script: string,
	options: string[],
): Promise<ChildSocket<any, any>> {
	const child = await new Promise<ChildProcessWithoutNullStreams>((resolve) => {
		const room = spawn(script, options, { env: process.env })
		const resolver = (data: Buffer) => {
			if (data.toString() === `ALIVE`) {
				room.stdout.off(`data`, resolver)
				resolve(room)
			}
		}
		room.stdout.on(`data`, resolver)
	})
	ROOMS.set(roomId, new ChildSocket(child, roomId))
	return new ChildSocket(child, roomId)
}

export const joinRoomTX: TransactionToken<
	(roomId: string, userId: string, enteredAtEpoch: number) => UserInRoomMeta
> = transaction({
	key: `joinRoom`,
	do: (tools, roomId, userId, enteredAtEpoch) => {
		const meta = { enteredAtEpoch }
		editRelationsInStore(
			usersInRooms,
			(relations) => {
				relations.set({ room: roomId, user: userId })
			},
			tools.env().store,
		)
		return meta
	},
})
export type JoinRoomIO = TransactionIO<typeof joinRoomTX>

export const leaveRoomTX: TransactionToken<
	(roomId: string, userId: string) => void
> = transaction({
	key: `leaveRoom`,
	do: ({ env }, roomId, userId) => {
		editRelationsInStore(
			usersInRooms,
			(relations) => {
				relations.delete({ room: roomId, user: userId })
			},
			env().store,
		)
	},
})
export type LeaveRoomIO = TransactionIO<typeof leaveRoomTX>

export const destroyRoomTX: TransactionToken<(roomKey: RoomKey) => void> =
	transaction({
		key: `destroyRoom`,
		do: ({ set, env }, roomId) => {
			editRelationsInStore(
				usersInRooms,
				(relations) => {
					relations.delete({ room: roomId })
				},
				env().store,
			)
			set(roomIndex, (s) => (s.delete(roomId), s))
			const room = ROOMS.get(roomId)
			if (room) {
				room.emit(`exit`)
				ROOMS.delete(roomId)
			}
		},
	})
