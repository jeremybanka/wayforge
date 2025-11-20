import type { ChildProcessWithoutNullStreams } from "node:child_process"
import { spawn } from "node:child_process"

import type { Store } from "atom.io/internal"
import {
	editRelationsInStore,
	findInStore,
	findRelationsInStore,
	getFromStore,
	getInternalRelationsFromStore,
	IMPLICIT,
	setIntoStore,
} from "atom.io/internal"
import type { Json } from "atom.io/json"
import type { RoomKey, Socket, SocketKey, UserKey } from "atom.io/realtime"
import { roomKeysAtom, usersInRooms } from "atom.io/realtime"

import { ChildSocket } from "../ipc-sockets"
import { realtimeMutableFamilyProvider } from "../realtime-mutable-family-provider"
import { realtimeMutableProvider } from "../realtime-mutable-provider"
import type { ServerConfig } from "../server-config"
import {
	selfListSelectors,
	socketKeysAtom,
	userKeysAtom,
	usersOfSockets,
} from "./server-user-store"

export type RoomMap = Map<
	string,
	ChildSocket<any, any, ChildProcessWithoutNullStreams>
>

declare global {
	var ATOM_IO_REALTIME_SERVER_ROOMS: RoomMap
}

export const ROOMS: RoomMap =
	globalThis.ATOM_IO_REALTIME_SERVER_ROOMS ??
	(globalThis.ATOM_IO_REALTIME_SERVER_ROOMS = new Map())

export const roomMeta: { count: number } = { count: 0 }

export async function spawnRoom(
	store: Store,
	roomKey: RoomKey,
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
	const roomSocket = new ChildSocket(child, roomKey)
	ROOMS.set(roomKey, roomSocket)
	setIntoStore(store, roomKeysAtom, (index) => (index.add(roomKey), index))

	roomSocket.on(`close`, () => {
		destroyRoom(store, roomKey)
	})

	return roomSocket
}

export function joinRoom(
	store: Store,
	roomKey: RoomKey,
	userKey: UserKey,
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

	editRelationsInStore(store, usersInRooms, (relations) => {
		relations.set({ room: roomKey, user: userKey })
	})
	const roomSocket = ROOMS.get(roomKey)
	if (!roomSocket) {
		store.logger.error(`❌`, `unknown`, roomKey, `no room found with this id`)
		return null
	}
	roomSocket.onAny((...payload) => {
		socket.emit(...payload)
	})
	roomSocket.emit(`user-joins`, userKey)

	toRoom = (payload) => {
		roomSocket.emit(`user::${userKey}`, ...payload)
	}
	while (roomQueue.length > 0) {
		const payload = roomQueue.shift()
		if (payload) toRoom(payload)
	}

	const leave = () => {
		socket.offAny(forward)
		toRoom([`user-leaves`])
		leaveRoom(store, roomKey, userKey)
	}

	return { leave, roomSocket }
}

export function leaveRoom(
	store: Store,
	roomKey: RoomKey,
	userKey: UserKey,
): void {
	editRelationsInStore(store, usersInRooms, (relations) => {
		relations.delete({ room: roomKey, user: userKey })
	})
}

export function destroyRoom(store: Store, roomKey: RoomKey): void {
	setIntoStore(store, roomKeysAtom, (s) => (s.delete(roomKey), s))
	editRelationsInStore(store, usersInRooms, (relations) => {
		relations.delete({ room: roomKey })
	})
	const room = ROOMS.get(roomKey)
	if (room) {
		room.emit(`exit`)
		ROOMS.delete(roomKey)
	}
}

export function provideRooms<RoomNames extends string>(
	{ store = IMPLICIT.STORE, socket }: ServerConfig,
	resolveRoomScript: (path: string) => [string, string[]],
): void {
	const socketKey = `socket::${socket.id}` satisfies SocketKey
	const userKey = getFromStore(
		store,
		findRelationsInStore(store, usersOfSockets, socketKey).userKeyOfSocket,
	)!

	const exposeMutable = realtimeMutableProvider({ socket, store })
	const exposeMutableFamily = realtimeMutableFamilyProvider({
		socket,
		store,
	})

	exposeMutable(roomKeysAtom)

	const usersInRoomsAtoms = getInternalRelationsFromStore(store, usersInRooms)
	const usersWhoseRoomsCanBeSeenSelector = findInStore(
		store,
		selfListSelectors,
		userKey,
	)
	exposeMutableFamily(usersInRoomsAtoms, usersWhoseRoomsCanBeSeenSelector)
	const usersOfSocketsAtoms = getInternalRelationsFromStore(
		store,
		usersOfSockets,
	)
	exposeMutableFamily(usersOfSocketsAtoms, socketKeysAtom)

	socket.on(`createRoom`, async (roomName: RoomNames) => {
		// logger.info(`[${shortId}]:${username}`, `creating room "${roomId}"`)
		const roomId = `room::${roomMeta.count++}` satisfies RoomKey
		await spawnRoom(store, roomId, ...resolveRoomScript(roomName))
		socket.on(`deleteRoom:${roomId}`, () => {
			// logger.info(`[${shortId}]:${username}`, `deleting room "${roomId}"`)
			destroyRoom(store, roomId)
		})
	})

	socket.on(`joinRoom`, (roomKey: RoomKey) => {
		// logger.info(`[${shortId}]:${username}`, `joining room "${roomId}"`)
		const { leave } = joinRoom(store, roomKey, userKey, socket)!
		socket.on(`leaveRoom:${roomKey}`, leave)
	})

	socket.on(`disconnect`, () => {
		editRelationsInStore(store, usersOfSockets, (relations) =>
			relations.delete(socketKey),
		)
		if (userKey) {
			setIntoStore(
				store,
				userKeysAtom,
				(index) => (index.delete(userKey), index),
			)
		}
		setIntoStore(
			store,
			socketKeysAtom,
			(index) => (index.delete(socketKey), index),
		)
		// logger.info(`${socket.id} disconnected`)
	})
}
