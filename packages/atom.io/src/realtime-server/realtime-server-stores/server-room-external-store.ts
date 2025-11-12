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
	const roomSocket = new ChildSocket(child, roomId)
	ROOMS.set(roomId, roomSocket)
	setIntoStore(store, roomIndex, (index) => (index.add(roomId), index))

	roomSocket.on(`close`, () => {
		destroyRoom(roomId, store)
	})

	return roomSocket
}

export function joinRoom(
	roomId: string,
	userId: string,
	socket: Socket,
	store: Store,
): {
	leave: () => void
	roomSocket: ChildSocket<any, any, ChildProcessWithoutNullStreams>
} {
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
	const roomSocket = ROOMS.get(roomId)!
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
		leaveRoom(roomId, userId, store)
	}

	return { leave, roomSocket }
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

export function destroyRoom(roomId: string, store: Store): void {
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
