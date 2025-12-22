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
	visibilityFromRoomSelector,
	visibleUsersInRoomsSelector,
} from "atom.io/realtime"
import { myRoomKeyAtom } from "atom.io/realtime-client"

import { ChildSocket, PROOF_OF_LIFE_SIGNAL } from "./ipc-sockets"
import { realtimeMutableFamilyProvider } from "./realtime-mutable-family-provider"
import { realtimeMutableProvider } from "./realtime-mutable-provider"
import { realtimeStateProvider } from "./realtime-state-provider"

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
				const room = spawn(command, args, {
					env: { ...process.env, REALTIME_ROOM_KEY: roomKey },
				})
				const resolver = (data: Buffer) => {
					const chunk = data.toString()
					if (chunk === PROOF_OF_LIFE_SIGNAL) {
						room.stdout.off(`data`, resolver)
						resolve(room)
					}
				}
				room.stdout.on(`data`, resolver)
			},
		)

		const room = new ChildSocket(child, roomKey)
		ROOMS.set(roomKey, room)
		setIntoStore(store, roomKeysAtom, (index) => (index.add(roomKey), index))
		editRelationsInStore(store, ownersOfRooms, (relations) => {
			relations.set({ room: roomKey, user: userKey })
		})

		const provideMutableFamily = realtimeMutableFamilyProvider({
			socket: room,
			consumer: roomKey,
			store,
		})
		const provideState = realtimeStateProvider({
			socket: room,
			consumer: roomKey,
			store,
		})
		const unsubFromRoomKey = provideState(myRoomKeyAtom, roomKey)

		const ownersOfRoomsAtoms = getInternalRelationsFromStore(
			store,
			ownersOfRooms,
		)
		const unsubFromOwnerKeys = provideMutableFamily(ownersOfRoomsAtoms, [
			roomKey,
		])
		const usersInRoomsAtoms = getInternalRelationsFromStore(store, usersInRooms)
		const unsubFromUsersInRooms = provideMutableFamily(
			usersInRoomsAtoms,
			findInStore(store, visibilityFromRoomSelector, roomKey),
		)

		room.on(`close`, () => {
			unsubFromRoomKey()
			unsubFromOwnerKeys()
			unsubFromUsersInRooms()
			destroyRoom({ store, socket, userKey })(roomKey)
		})

		return room
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
	const enterRoom = (roomKey: RoomKey): void => {
		store.logger.info(
			`📡`,
			`socket`,
			socket.id ?? `[ID MISSING?!]`,
			`👤 ${userKey} enters ${roomKey}`,
		)
		const childSocket = ROOMS.get(roomKey)
		if (!childSocket) {
			store.logger.error(`❌`, `unknown`, roomKey, `no room found with this id`)
			return
		}
		const toUser = socket.emit.bind(socket)
		childSocket.on(userKey, toUser)

		const roomQueue: [string, ...Json.Array][] = []
		const pushToRoomQueue = (payload: [string, ...Json.Array]): void => {
			roomQueue.push(payload)
		}
		let toRoom = pushToRoomQueue
		const forward: AllEventsListener<EventsMap> = (...payload) => {
			toRoom([userKey, ...payload])
		}
		socket.onAny(forward)

		const dcUserFromRoom = () => {
			store.logger.info(
				`📡`,
				`socket`,
				socket.id ?? `[ID MISSING?!]`,
				`👤 ${userKey} is has lost connection to ${roomKey}`,
			)
			socket.offAny(forward)
			childSocket.off(userKey, toUser)
			toRoom([`user-leaves`, userKey])
		}

		const exitRoom = () => {
			store.logger.info(
				`📡`,
				`socket`,
				socket.id ?? `[ID MISSING?!]`,
				`👤 ${userKey} leaves ${roomKey}`,
			)
			dcUserFromRoom()
			editRelationsInStore(store, usersInRooms, (relations) => {
				relations.delete({ room: roomKey, user: userKey })
			})

			roomSocket.off(`leaveRoom`, exitRoom)
			roomSocket.on(`joinRoom`, enterRoom)
		}

		editRelationsInStore(store, usersInRooms, (relations) => {
			relations.set({ room: roomKey, user: userKey })
		})

		childSocket.emit(`user-joins`, userKey)

		toRoom = (payload) => {
			childSocket.emit(...payload)
		}
		while (roomQueue.length > 0) {
			const payload = roomQueue.shift()
			if (payload) toRoom(payload)
		}

		socket.on(`disconnect`, dcUserFromRoom)
		roomSocket.on(`leaveRoom`, exitRoom)
		roomSocket.off(`joinRoom`, enterRoom)
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
			`👤 ${userKey} attempts to delete ${roomKey}`,
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
				`👤 ${userKey} deletes ${roomKey}`,
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
			`👤 ${userKey} failed to delete ${roomKey}; its owner is ${owner}`,
		)
	}
}

export type ProvideRoomsConfig<RoomNames extends string> = {
	resolveRoomScript: (path: RoomNames) => [string, string[]]
	roomNames: RoomNames[]
	roomTimeLimit?: number
	userKey: UserKey
	store: RootStore
	socket: Socket
}
export function provideRooms<RoomNames extends string>({
	store = IMPLICIT.STORE,
	socket,
	resolveRoomScript,
	roomNames,
	userKey,
}: ProvideRoomsConfig<RoomNames>): () => void {
	const roomSocket = castSocket<
		TypedSocket<RoomSocketInterface<RoomNames>, never>
	>(socket, createRoomSocketGuard(roomNames))
	const exposeMutable = realtimeMutableProvider({
		socket,
		store,
		consumer: userKey,
	})
	const unsubFromRoomKeys = exposeMutable(roomKeysAtom)
	const usersInRoomsAtoms = getInternalRelationsFromStore(store, usersInRooms)
	const [, usersInRoomsAtomsUsersOnly] = getInternalRelationsFromStore(
		store,
		usersInRooms,
		`split`,
	)
	const usersWhoseRoomsCanBeSeenSelector = findInStore(
		store,
		visibleUsersInRoomsSelector,
		userKey,
	)
	const ownersOfRoomsAtoms = getInternalRelationsFromStore(store, ownersOfRooms)
	const exposeMutableFamily = realtimeMutableFamilyProvider({
		socket,
		store,
		consumer: userKey,
	})
	const unsubFromUsersInRooms = exposeMutableFamily(
		usersInRoomsAtoms,
		usersWhoseRoomsCanBeSeenSelector,
	)
	const unsubFromOwnersOfRooms = exposeMutableFamily(
		ownersOfRoomsAtoms,
		usersWhoseRoomsCanBeSeenSelector,
	)
	const enterRoom = provideEnterAndExit({
		store,
		socket,
		roomSocket,
		userKey,
	})

	const userRoomSet = getFromStore(store, usersInRoomsAtomsUsersOnly, userKey)
	for (const userRoomKey of userRoomSet) {
		enterRoom(userRoomKey)
		break
	}
	roomSocket.on(
		`createRoom`,
		spawnRoom({ store, socket, userKey, resolveRoomScript }),
	)
	roomSocket.on(`deleteRoom`, destroyRoom({ store, socket, userKey }))
	return () => {
		unsubFromRoomKeys()
		unsubFromUsersInRooms()
		unsubFromOwnersOfRooms()
	}
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
