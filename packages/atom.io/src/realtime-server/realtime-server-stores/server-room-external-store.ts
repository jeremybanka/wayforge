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
import type { Socket, SocketKey } from "atom.io/realtime"
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
	setIntoStore(store, roomKeysAtom, (index) => (index.add(roomId), index))

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
	setIntoStore(store, roomKeysAtom, (s) => (s.delete(roomId), s))
	editRelationsInStore(
		usersInRooms,
		(relations) => {
			relations.delete({ room: roomId })
		},
		store,
	)
	const room = ROOMS.get(roomId)
	if (room) {
		room.emit(`exit`)
		ROOMS.delete(roomId)
	}
}

export function useRooms<RoomNames extends string>(
	{ store = IMPLICIT.STORE, socket }: ServerConfig,
	resolveRoomScript: (path: string) => [string, string[]],
): void {
	const socketKey = `socket::${socket.id}` satisfies SocketKey
	const userKeyOfSocket = getFromStore(
		store,
		findRelationsInStore(usersOfSockets, socketKey, store).userKeyOfSocket,
	)!

	const exposeMutable = realtimeMutableProvider({ socket, store })
	const exposeMutableFamily = realtimeMutableFamilyProvider({
		socket,
		store,
	})

	exposeMutable(roomKeysAtom)

	const usersInRoomsAtoms = getInternalRelationsFromStore(usersInRooms, store)
	const usersWhoseRoomsCanBeSeenSelector = findInStore(
		store,
		selfListSelectors,
		userKeyOfSocket,
	)
	exposeMutableFamily(usersInRoomsAtoms, usersWhoseRoomsCanBeSeenSelector)
	const usersOfSocketsAtoms = getInternalRelationsFromStore(
		usersOfSockets,
		store,
	)
	exposeMutableFamily(usersOfSocketsAtoms, socketKeysAtom)

	socket.on(`createRoom`, async (roomName: RoomNames) => {
		// logger.info(`[${shortId}]:${username}`, `creating room "${roomId}"`)
		const roomId = `room::${roomMeta.count++}`
		await spawnRoom(store, roomId, ...resolveRoomScript(roomName))
		socket.on(`deleteRoom:${roomId}`, () => {
			// logger.info(`[${shortId}]:${username}`, `deleting room "${roomId}"`)
			destroyRoom(store, roomId)
		})
	})

	socket.on(`joinRoom`, (roomId: string) => {
		// logger.info(`[${shortId}]:${username}`, `joining room "${roomId}"`)
		const { leave } = joinRoom(store, roomId, userKeyOfSocket, socket)!
		socket.on(`leaveRoom:${roomId}`, leave)
	})

	socket.on(`disconnect`, () => {
		const userKeyState = findRelationsInStore(
			usersOfSockets,
			socketKey,
			store,
		).userKeyOfSocket
		const userKey = getFromStore(store, userKeyState)
		editRelationsInStore(
			usersOfSockets,
			(relations) => relations.delete(socketKey),
			store,
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
		// cleanup()
	})
}
