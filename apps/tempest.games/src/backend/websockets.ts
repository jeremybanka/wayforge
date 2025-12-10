import { findState, getInternalRelations } from "atom.io"
import { IMPLICIT } from "atom.io/internal"
import type { UserKey } from "atom.io/realtime"
import {
	roomKeysAtom,
	usersInRooms,
	visibleUsersInRoomsSelector,
} from "atom.io/realtime"
import type { Handshake, ServerConfig } from "atom.io/realtime-server"
import {
	provideRooms,
	realtimeMutableFamilyProvider,
	realtimeMutableProvider,
	realtimeStateProvider,
} from "atom.io/realtime-server"
import { CookieMap } from "bun"
import { eq } from "drizzle-orm"
import type { Socket } from "socket.io"

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

export const sessionMiddleware = async (
	handshake: Handshake,
): Promise<Error | UserKey> => {
	const { username } = handshake.auth as { username: string }
	if (!username) {
		return new Error(`No auth header provided`)
	}
	const cookies = new CookieMap(handshake.headers.cookie ?? ``)
	const sessionKey = cookies.get(`sessionKey`)
	if (!sessionKey) {
		return new Error(`No session key provided`)
	}
	const user = await db.drizzle.query.users.findFirst({
		where: eq(users.username, username),
	})
	if (!user?.emailVerified) {
		return new Error(`Email not verified`)
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
		return `user::${user.id}` satisfies UserKey
	}
	logger.info(`${username} couldn't authenticate`)
	return new Error(`Authentication error`)
}

export const serveSocket = (config: ServerConfig): (() => void) => {
	const { socket, userKey } = config
	const rawUserId = userKey?.replace(/^user::/, ``)
	const myRoomAtoms = getInternalRelations(usersInRooms)

	const selfListSelector = findState(visibleUsersInRoomsSelector, userKey)
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

	provideRooms({
		socket,
		userKey,
		store: IMPLICIT.STORE,
		roomNames: workerNames,
		resolveRoomScript,
	})

	socket.on(`changeUsername`, async (newUsername) => {
		logger.info(`changing username to`, newUsername)
		if (rawUserId && typeof newUsername === `string`) {
			await db.drizzle
				.update(users)
				.set({ username: newUsername })
				.where(eq(users.id, rawUserId))
			socket.emit(`usernameChanged`, newUsername)
		}
	})

	return () => {
		for (const unsub of unsubs) unsub()
	}
}
