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
import type {
	AllEventsListener,
	EventsMap,
	RoomKey,
	RoomSocketInterface,
	Socket,
	SocketKey,
	TypedSocket,
	UserKey,
} from "atom.io/realtime"
import { ownersOfRooms, roomKeysAtom, usersInRooms } from "atom.io/realtime"

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
	userKey: UserKey,
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

	editRelationsInStore(store, ownersOfRooms, (relations) => {
		relations.set({ room: roomKey, user: userKey })
	})

	roomSocket.on(`close`, () => {
		destroyRoom(store)(roomKey)
	})

	return roomSocket
}

export function provideEnterAndExit(
	store: Store,
	userKey: UserKey,
	socket: Socket,
): {
	enterRoom: (roomKey: RoomKey) => void
} {
	const enterRoom = (roomKey: RoomKey) => {
		const exitRoom = () => {
			socket.offAny(forward)
			toRoom([`user-leaves`])
			leaveRoom(store, roomKey, userKey)
			socket.off(`leaveRoom`, exitRoom)
			socket.on(`joinRoom`, enterRoom)
		}

		socket.on(`leaveRoom`, exitRoom)
		socket.off(`joinRoom`, enterRoom)

		const roomQueue: [string, ...Json.Array][] = []
		const pushToRoomQueue = (payload: [string, ...Json.Array]): void => {
			roomQueue.push(payload)
		}
		let toRoom = pushToRoomQueue
		const forward: AllEventsListener<EventsMap> = (...payload) => {
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
	}
	socket.on(`joinRoom`, enterRoom)
	return { enterRoom }
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

export function destroyRoom(store: Store): (roomKey: RoomKey) => void {
	return (roomKey: RoomKey) => {
		// logger.info(`[${shortId}]:${username}`, `deleting room "${roomId}"`)
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
}

export type ProvideRoomsConfig = {
	resolveRoomScript: (path: string) => [string, string[]]
	roomTimeLimit?: number
}
export function provideRooms<RoomNames extends string>({
	store = IMPLICIT.STORE,
	socket,
	resolveRoomScript,
}: ProvideRoomsConfig & ServerConfig): void {
	const socketKey = `socket::${socket.id}` satisfies SocketKey
	const userKey = getFromStore(
		store,
		findRelationsInStore(store, usersOfSockets, socketKey).userKeyOfSocket,
	)!
	const roomSocket = socket as TypedSocket<RoomSocketInterface<RoomNames>, {}>

	const exposeMutable = realtimeMutableProvider({ socket, store })
	const exposeMutableFamily = realtimeMutableFamilyProvider({
		socket,
		store,
	})

	exposeMutable(roomKeysAtom)

	const [, usersInRoomsAtoms] = getInternalRelationsFromStore(
		store,
		usersInRooms,
		`split`,
	)
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

	const createRoom = async (roomName: RoomNames) => {
		// logger.info(`[${shortId}]:${username}`, `creating room "${roomId}"`)
		const roomKey = `room::${roomMeta.count++}` satisfies RoomKey
		await spawnRoom(store, userKey, roomKey, ...resolveRoomScript(roomName))
	}

	const { enterRoom } = provideEnterAndExit(store, userKey, roomSocket)

	const userRoomSet = getFromStore(store, usersInRoomsAtoms, userKey)
	for (const userRoomKey of userRoomSet) {
		enterRoom(userRoomKey)
		break
	}

	roomSocket.on(`createRoom`, createRoom)
	roomSocket.on(`deleteRoom`, destroyRoom(store))
	socket.on(`disconnect`, () => {
		// logger.info(`${socket.id} disconnected`)
		editRelationsInStore(store, usersOfSockets, (rel) => rel.delete(socketKey))
		setIntoStore(store, userKeysAtom, (keys) => (keys.delete(userKey), keys))
		setIntoStore(store, socketKeysAtom, (keys) => (keys.delete(socketKey), keys))
	})
}
