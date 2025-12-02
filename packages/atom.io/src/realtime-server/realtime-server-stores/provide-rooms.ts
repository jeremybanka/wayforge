import type { ChildProcessWithoutNullStreams } from "node:child_process"
import { spawn } from "node:child_process"

import type { RootStore } from "atom.io/internal"
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
	SocketGuard,
	SocketKey,
	StandardSchemaV1,
	TypedSocket,
	UserKey,
} from "atom.io/realtime"
import {
	castSocket,
	isRoomKey,
	ownersOfRooms,
	roomKeysAtom,
	usersInRooms,
} from "atom.io/realtime"

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

export type SpawnRoomConfig<RoomNames extends string> = {
	store: RootStore
	socket: Socket
	userKey: UserKey
	resolveRoomScript: (roomName: RoomNames) => [string, string[]]
}
export function spawnRoom<RoomNames extends string>({
	store,
	socket,
	userKey,
	resolveRoomScript,
}: SpawnRoomConfig<RoomNames>): (
	roomName: RoomNames,
) => Promise<ChildSocket<any, any>> {
	return async (roomName) => {
		store.logger.info(
			`📡`,
			`socket`,
			socket.id ?? `[ID MISSING?!]`,
			`👤 ${userKey} spawns room ${roomName}`,
		)
		const roomKey = `room::${roomMeta.count++}` satisfies RoomKey
		const [command, args] = resolveRoomScript(roomName)
		const child = await new Promise<ChildProcessWithoutNullStreams>(
			(resolve) => {
				const room = spawn(command, args, { env: process.env })
				const resolver = (data: Buffer) => {
					if (data.toString() === `ALIVE`) {
						room.stdout.off(`data`, resolver)
						resolve(room)
					}
				}
				room.stdout.on(`data`, resolver)
			},
		)
		const roomSocket = new ChildSocket(child, roomKey)
		ROOMS.set(roomKey, roomSocket)
		setIntoStore(store, roomKeysAtom, (index) => (index.add(roomKey), index))

		editRelationsInStore(store, ownersOfRooms, (relations) => {
			relations.set({ room: roomKey, user: userKey })
		})

		roomSocket.on(`close`, () => {
			destroyRoom({ store, socket, userKey })(roomKey)
		})

		return roomSocket
	}
}

export type ProvideEnterAndExitConfig = {
	store: RootStore
	socket: Socket
	roomSocket: TypedSocket<RoomSocketInterface<any>, any>
	userKey: UserKey
}
export function provideEnterAndExit({
	store,
	socket,
	roomSocket,
	userKey,
}: ProvideEnterAndExitConfig): (roomKey: RoomKey) => void {
	const enterRoom = (roomKey: RoomKey) => {
		store.logger.info(
			`📡`,
			`socket`,
			socket.id ?? `[ID MISSING?!]`,
			`👤 ${userKey} enters room ${roomKey}`,
		)

		const exitRoom = () => {
			store.logger.info(
				`📡`,
				`socket`,
				socket.id ?? `[ID MISSING?!]`,
				`👤 ${userKey} leaves room ${roomKey}`,
			)
			socket.offAny(forward)
			toRoom([`user-leaves`])
			editRelationsInStore(store, usersInRooms, (relations) => {
				relations.delete({ room: roomKey, user: userKey })
			})
			roomSocket.off(`leaveRoom`, exitRoom)
			roomSocket.on(`joinRoom`, enterRoom)
		}

		roomSocket.on(`leaveRoom`, exitRoom)
		roomSocket.off(`joinRoom`, enterRoom)

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
		const childSocket = ROOMS.get(roomKey)
		if (!childSocket) {
			store.logger.error(`❌`, `unknown`, roomKey, `no room found with this id`)
			return null
		}
		childSocket.onAny((...payload) => {
			socket.emit(...payload)
		})
		childSocket.emit(`user-joins`, userKey)

		toRoom = (payload) => {
			childSocket.emit(`user::${userKey}`, ...payload)
		}
		while (roomQueue.length > 0) {
			const payload = roomQueue.shift()
			if (payload) toRoom(payload)
		}
	}
	roomSocket.on(`joinRoom`, enterRoom)
	return enterRoom
}

export type DestroyRoomConfig = {
	store: RootStore
	socket: Socket
	userKey: UserKey
}
export function destroyRoom({
	store,
	socket,
	userKey,
}: DestroyRoomConfig): (roomKey: RoomKey) => void {
	return (roomKey: RoomKey) => {
		store.logger.info(
			`📡`,
			`socket`,
			socket.id ?? `[ID MISSING?!]`,
			`👤 ${userKey} attempts to delete room ${roomKey}`,
		)
		const owner = getFromStore(
			store,
			findRelationsInStore(store, ownersOfRooms, roomKey).userKeyOfRoom,
		)
		if (owner === userKey) {
			store.logger.info(
				`📡`,
				`socket`,
				socket.id ?? `[ID MISSING?!]`,
				`👤 ${userKey} deletes room ${roomKey}`,
			)
			setIntoStore(store, roomKeysAtom, (s) => (s.delete(roomKey), s))
			editRelationsInStore(store, usersInRooms, (relations) => {
				relations.delete({ room: roomKey })
			})
			const room = ROOMS.get(roomKey)
			if (room) {
				room.emit(`exit`)
				ROOMS.delete(roomKey)
			}
			return
		}
		store.logger.info(
			`📡`,
			`socket`,
			socket.id ?? `[ID MISSING?!]`,
			`👤 ${userKey} failed to delete room ${roomKey}; room owner is ${owner}`,
		)
	}
}

export type ProvideRoomsConfig<RoomNames extends string> = {
	resolveRoomScript: (path: RoomNames) => [string, string[]]
	roomNames: RoomNames[]
	roomTimeLimit?: number
}
export function provideRooms<RoomNames extends string>({
	store = IMPLICIT.STORE,
	socket,
	resolveRoomScript,
	roomNames,
}: ProvideRoomsConfig<RoomNames> & ServerConfig): void {
	const socketKey = `socket::${socket.id}` satisfies SocketKey
	const userKey = getFromStore(
		store,
		findRelationsInStore(store, usersOfSockets, socketKey).userKeyOfSocket,
	)!
	// const roomSocket = socket as TypedSocket<RoomSocketInterface<RoomNames>, {}>
	const roomSocket = castSocket<TypedSocket<RoomSocketInterface<RoomNames>, {}>>(
		socket,
		createRoomSocketGuard(roomNames),
	)

	const exposeMutable = realtimeMutableProvider({ socket, store, userKey })
	const exposeMutableFamily = realtimeMutableFamilyProvider({
		socket,
		store,
		userKey,
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
	// const usersOfSocketsAtoms = getInternalRelationsFromStore(
	// 	store,
	// 	usersOfSockets,
	// )
	// exposeMutableFamily(usersOfSocketsAtoms, socketKeysAtom)
	const [ownersOfRoomsAtoms] = getInternalRelationsFromStore(
		store,
		ownersOfRooms,
		`split`,
	)
	exposeMutableFamily(ownersOfRoomsAtoms, usersWhoseRoomsCanBeSeenSelector)

	const enterRoom = provideEnterAndExit({ store, socket, roomSocket, userKey })

	const userRoomSet = getFromStore(store, usersInRoomsAtoms, userKey)
	for (const userRoomKey of userRoomSet) {
		enterRoom(userRoomKey)
		break
	}

	roomSocket.on(
		`createRoom`,
		spawnRoom({ store, socket, userKey, resolveRoomScript }),
	)
	roomSocket.on(`deleteRoom`, destroyRoom({ store, socket, userKey }))
	socket.on(`disconnect`, () => {
		store.logger.info(
			`📡`,
			`socket`,
			socket.id ?? `[ID MISSING?!]`,
			`👤 ${userKey} disconnects`,
		)
		editRelationsInStore(store, usersOfSockets, (rel) => rel.delete(socketKey))
		setIntoStore(store, userKeysAtom, (keys) => (keys.delete(userKey), keys))
		setIntoStore(store, socketKeysAtom, (keys) => (keys.delete(socketKey), keys))
	})
}

const roomKeySchema: StandardSchemaV1<Json.Array, [RoomKey]> = {
	"~standard": {
		version: 1,
		vendor: `atom.io`,
		validate: ([maybeRoomKey]: Json.Array) => {
			if (typeof maybeRoomKey === `string`) {
				if (isRoomKey(maybeRoomKey)) {
					return { value: [maybeRoomKey] }
				}
				return {
					issues: [
						{
							message: `Room key must start with "room::"`,
						},
					],
				}
			}
			return {
				issues: [
					{
						message: `Room key must be a string`,
					},
				],
			}
		},
	},
}

function createRoomSocketGuard<RoomNames extends string>(
	roomNames: RoomNames[],
): SocketGuard<RoomSocketInterface<RoomNames>> {
	return {
		createRoom: {
			"~standard": {
				version: 1,
				vendor: `atom.io`,
				validate: ([maybeRoomName]) => {
					if (roomNames.includes(maybeRoomName as RoomNames)) {
						return { value: [maybeRoomName as RoomNames] }
					}
					return {
						issues: [
							{
								message:
									`Room name must be one of the following:\n - ` +
									roomNames.join(`\n - `),
							},
						],
					}
				},
			},
		},
		joinRoom: roomKeySchema,
		deleteRoom: roomKeySchema,
		leaveRoom: {
			"~standard": {
				version: 1,
				vendor: `atom.io`,
				validate: () => ({ value: [] }),
			},
		},
	}
}
