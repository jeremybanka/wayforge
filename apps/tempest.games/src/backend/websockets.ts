import {
	editRelationsInStore,
	findInStore,
	findRelationsInStore,
	getFromStore,
	IMPLICIT,
	setIntoStore,
} from "atom.io/internal"
import type { SocketKey, UserKey } from "atom.io/realtime-server"
import {
	socketAtoms,
	socketIndex,
	userIndex,
	usersOfSockets,
} from "atom.io/realtime-server"
import { eq } from "drizzle-orm"
import type { DefaultEventsMap, ExtendedError, Socket } from "socket.io"

import { users } from "../database/tempest-db-schema"
import type {
	TempestSocketDown,
	TempestSocketServerSide,
	TempestSocketUp,
} from "../library/socket-interface"
import { db } from "./db"
import { logger } from "./logger"
import { userSessions } from "./user-sessions"

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
	const { username, sessionKey } = socket.handshake.auth as {
		username: string
		sessionKey: string
	}
	if (!(username && sessionKey)) {
		next(new Error(`No auth header provided`))
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

	if (userSessions?.has(user.id, sessionKey)) {
		const socketState = findInStore(IMPLICIT.STORE, socketAtoms, socketKey)
		setIntoStore(IMPLICIT.STORE, socketState, socket)
		editRelationsInStore(
			usersOfSockets,
			(relations) => {
				relations.set(userKey, socketKey)
			},
			IMPLICIT.STORE,
		)
		setIntoStore(IMPLICIT.STORE, userIndex, (index) => index.add(userKey))
		setIntoStore(IMPLICIT.STORE, socketIndex, (index) => index.add(socketKey))
		logger.info(`${username} connected on ${socket.id}`)
		next()
	} else {
		logger.info(`${username} couldn't authenticate`)
		next(new Error(`Authentication error`))
	}
}

export const serveSocket = (socket: TempestServerSocket): void => {
	// const syncContinuity = prepareToExposeRealtimeContinuity({
	// 	socket,
	// 	store: IMPLICIT.STORE,
	// })
	// const cleanup = syncContinuity(countContinuity)
	const socketKey = `socket::${socket.id}` satisfies SocketKey
	const userOfSocketSelector = findRelationsInStore(
		usersOfSockets,
		socketKey,
		IMPLICIT.STORE,
	).userKeyOfSocket
	const userKeyOfSocket = getFromStore(IMPLICIT.STORE, userOfSocketSelector)
	const rawUserId = userKeyOfSocket?.replace(/^user::/, ``)

	socket.on(`changeUsername`, async (username) => {
		logger.info(`changing username to`, username)
		if (rawUserId) {
			await db.drizzle
				.update(users)
				.set({ username })
				.where(eq(users.id, rawUserId))
			socket.emit(`usernameChanged`, username)
		}
	})

	socket.on(`disconnect`, () => {
		const userKeyState = findRelationsInStore(
			usersOfSockets,
			socketKey,
			IMPLICIT.STORE,
		).userKeyOfSocket
		const userKey = getFromStore(IMPLICIT.STORE, userKeyState)
		editRelationsInStore(
			usersOfSockets,
			(relations) => {
				relations.delete(socketKey)
			},
			IMPLICIT.STORE,
		)
		if (userKey) {
			setIntoStore(
				IMPLICIT.STORE,
				userIndex,
				(index) => (index.delete(userKey), index),
			)
		}
		setIntoStore(
			IMPLICIT.STORE,
			socketIndex,
			(index) => (index.delete(socketKey), index),
		)
		logger.info(`${socket.id} disconnected`)
		// cleanup()
	})
}
