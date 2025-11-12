import type { ChildProcessWithoutNullStreams } from "node:child_process"
import { spawn } from "node:child_process"

import type { TransactionIO, TransactionToken } from "atom.io"
import { setState, transaction } from "atom.io"
import type { Store } from "atom.io/internal"
import { editRelationsInStore, setIntoStore } from "atom.io/internal"
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
	command: string,
	args: string[],
	store: Store,
): Promise<ChildSocket<any, any>> {
	const child = await new Promise<ChildProcessWithoutNullStreams>((resolve) => {
		const room = spawn(command, args, { env: process.env })
		const resolver = (data: Buffer) => {
			if (data.toString() === `ALIVE`) {
				room.stdout.off(`data`, resolver)
				resolve(room)
			}
		}
		room.stdout.on(`data`, resolver)
	})
	const childSocket = new ChildSocket(child, roomId)
	ROOMS.set(roomId, childSocket)
	setIntoStore(store, roomIndex, (index) => (index.add(roomId), index))

	return childSocket
}

export function joinRoom(roomId: string, userId: string, store: Store): void {
	editRelationsInStore(
		usersInRooms,
		(relations) => {
			relations.set({ room: roomId, user: userId })
		},
		store,
	)
}

export function leaveRoom(roomId: string, userId: string, store: Store): void {
	editRelationsInStore(
		usersInRooms,
		(relations) => {
			relations.delete({ room: roomId, user: userId })
		},
		store,
	)
}

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

export function destroyRoom(roomId: string, store: Store): void {
	editRelationsInStore(
		usersInRooms,
		(relations) => {
			relations.delete({ room: roomId })
		},
		store,
	)
	setState(roomIndex, (s) => (s.delete(roomId), s))
	const room = ROOMS.get(roomId)
	if (room) {
		room.emit(`exit`)
		ROOMS.delete(roomId)
	}
}
