import type { ChildProcessWithoutNullStreams } from "node:child_process"
import { spawn } from "node:child_process"

import type { Store } from "atom.io/internal"
import { editRelationsInStore, setIntoStore } from "atom.io/internal"
import type { Json } from "atom.io/json"
import type { Socket } from "atom.io/realtime"
import { roomIndex, usersInRooms } from "atom.io/realtime"

import { ChildSocket } from "../ipc-sockets"

export const ROOMS: Map<
	string,
	ChildSocket<any, any, ChildProcessWithoutNullStreams>
> = new Map()

export async function spawnRoom(
	store: Store,
	roomId: string,
	command: string,
	args: string[],
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
	const roomSocket = new ChildSocket(child, roomId)
	ROOMS.set(roomId, roomSocket)
	setIntoStore(store, roomIndex, (index) => (index.add(roomId), index))

	roomSocket.on(`close`, () => {
		destroyRoom(store, roomId)
	})

	return roomSocket
}

export function joinRoom(
	store: Store,
	roomId: string,
	userId: string,
	socket: Socket,
): {
	leave: () => void
	roomSocket: ChildSocket<any, any, ChildProcessWithoutNullStreams>
} | null {
	const roomQueue: [string, ...Json.Array][] = []
	const pushToRoomQueue = (payload: [string, ...Json.Array]): void => {
		roomQueue.push(payload)
	}
	let toRoom = pushToRoomQueue
	const forward = (...payload: [string, ...Json.Array]) => {
		toRoom(payload)
	}
	socket.onAny(forward)

	editRelationsInStore(
		usersInRooms,
		(relations) => {
			relations.set({ room: roomId, user: userId })
		},
		store,
	)
	const roomSocket = ROOMS.get(roomId)
	if (!roomSocket) {
		store.logger.error(`❌`, `unknown`, roomId, `no room found with this id`)
		return null
	}
	roomSocket.onAny((...payload) => {
		socket.emit(...payload)
	})
	roomSocket.emit(`user-joins`, userId)

	toRoom = (payload) => {
		roomSocket.emit(`user::${userId}`, ...payload)
	}
	while (roomQueue.length > 0) {
		const payload = roomQueue.shift()
		if (payload) toRoom(payload)
	}

	const leave = () => {
		socket.offAny(forward)
		toRoom([`user-leaves`])
		leaveRoom(store, roomId, userId)
	}

	return { leave, roomSocket }
}

export function leaveRoom(store: Store, roomId: string, userId: string): void {
	editRelationsInStore(
		usersInRooms,
		(relations) => {
			relations.delete({ room: roomId, user: userId })
		},
		store,
	)
}

export function destroyRoom(store: Store, roomId: string): void {
	editRelationsInStore(
		usersInRooms,
		(relations) => {
			relations.delete({ room: roomId })
		},
		store,
	)
	setIntoStore(store, roomIndex, (s) => (s.delete(roomId), s))
	const room = ROOMS.get(roomId)
	if (room) {
		room.emit(`exit`)
		ROOMS.delete(roomId)
	}
}
