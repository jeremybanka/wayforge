import { findState, getInternalRelations, getState } from "atom.io"
import {
	editRelationsInStore,
	findInStore,
	findRelationsInStore,
	getFromStore,
	IMPLICIT,
	setIntoStore,
} from "atom.io/internal"
import type { SocketKey, UserKey } from "atom.io/realtime"
import { roomKeysAtom, usersInRooms } from "atom.io/realtime"
import {
	provideIdentity,
	provideRooms,
	realtimeMutableFamilyProvider,
	realtimeMutableProvider,
	realtimeStateProvider,
	ROOMS,
	selfListSelectors,
	socketAtoms,
	socketKeysAtom,
	userKeysAtom,
	usersOfSockets,
} from "atom.io/realtime-server"
import { CookieMap } from "bun"
import { eq } from "drizzle-orm"
import type { DefaultEventsMap, ExtendedError, Socket } from "socket.io"

import { resolveRoomScript, workerNames } from "../backend.worker"
import { users, userSessions } from "../database/tempest-db-schema"
import type {
	TempestSocketDown,
	TempestSocketServerSide,
	TempestSocketUp,
} from "../library/socket-interface"
import { cpuCountAtom } from "../library/store"
import { db } from "./db"
import { logger } from "./logger"
// import { userSessions } from "./user-sessions"

export type TempestServerSocket = Socket<
	TempestSocketUp,
	TempestSocketDown,
	TempestSocketServerSide
>

export interface EventsMap {
	[event: string]: any
}
type SocketServerMiddleware<
	ListenEvents extends EventsMap = DefaultEventsMap,
	EmitEvents extends EventsMap = DefaultEventsMap,
	ServerSideEvents extends EventsMap = DefaultEventsMap,
	SocketData = any,
> = (
	socket: Socket<ListenEvents, EmitEvents, ServerSideEvents, SocketData>,
	next: (err?: ExtendedError) => void,
) => void

export const sessionMiddleware: SocketServerMiddleware = async (
	socket,
	next,
) => {
	const { username } = socket.handshake.auth as { username: string }
	if (!username) {
		next(new Error(`No auth header provided`))
		return
	}
	const cookies = new CookieMap(socket.handshake.headers.cookie ?? ``)
	const sessionKey = cookies.get(`sessionKey`)
	if (!sessionKey) {
		next(new Error(`No session key provided`))
		return
	}
	const user = await db.drizzle.query.users.findFirst({
		where: eq(users.username, username),
	})
	if (!user?.emailVerified) {
		next(new Error(`Email not verified`))
		return
	}
	const userKey = `user::${user.id}` satisfies UserKey
	const socketKey = `socket::${socket.id}` satisfies SocketKey
	const session = await db.drizzle.query.userSessions.findFirst({
		where: eq(userSessions.sessionKey, sessionKey),
	})

	if (session) {
		const socketState = findInStore(IMPLICIT.STORE, socketAtoms, socketKey)
		setIntoStore(IMPLICIT.STORE, socketState, socket)
		editRelationsInStore(IMPLICIT.STORE, usersOfSockets, (relations) => {
			relations.set(userKey, socketKey)
		})
		setIntoStore(IMPLICIT.STORE, onlineUsersAtom, (index) => index.add(userKey))
		setIntoStore(IMPLICIT.STORE, socketKeysAtom, (index) => index.add(socketKey))
		logger.info(`${username} connected on ${socket.id}`)
		next()
	} else {
		logger.info(`${username} couldn't authenticate`)
		next(new Error(`Authentication error`))
	}
}

export const serveSocket = (socket: TempestServerSocket): void => {
	const socketKey = `socket::${socket.id}` satisfies SocketKey
	const userOfSocketSelector = findRelationsInStore(
		IMPLICIT.STORE,
		usersOfSockets,
		socketKey,
	).userKeyOfSocket
	const userKey = getFromStore(IMPLICIT.STORE, userOfSocketSelector)!
	const rawUserId = userKey?.replace(/^user::/, ``)
	const myRoomAtoms = getInternalRelations(usersInRooms)

	const selfListSelector = findState(selfListSelectors, userKey)
	const provideFamily = realtimeMutableFamilyProvider({ socket, userKey })

	socket.onAny((event, ...args) => {
		logger.info(`🛰️ << 📡`, { event, args })
	})
	socket.onAnyOutgoing((event, ...args) => {
		logger.info(`🛰️ >> 📡`, { event, args })
	})

	const unsubs = [
		...[cpuCountAtom].map((token) =>
			realtimeStateProvider({ socket, userKey })(token),
		),
		...[roomKeysAtom].map(realtimeMutableProvider({ socket, userKey })),
		...[myRoomAtoms].map((atoms) => provideFamily(atoms, selfListSelector)),
	]

	provideIdentity({
		socket,
		userKey,
	})
	provideRooms({
		socket,
		userKey,
		store: IMPLICIT.STORE,
		roomNames: workerNames,
		resolveRoomScript,
	})

	socket.on(`changeUsername`, async (newUsername) => {
		logger.info(`changing username to`, newUsername)
		if (rawUserId) {
			await db.drizzle
				.update(users)
				.set({ username: newUsername })
				.where(eq(users.id, rawUserId))
			socket.emit(`usernameChanged`, newUsername)
		}
	})

	socket.on(`disconnect`, () => {
		for (const unsub of unsubs) unsub()
	})
}
