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
	prepareToExposeRealtimeContinuity,
	socketAtoms,
	socketIndex,
	userIndex,
	usersOfSockets,
} from "atom.io/realtime-server"
import type { DefaultEventsMap, ExtendedError, Socket } from "socket.io"

import { countContinuity } from "../library/store"
import { logger } from "./logger"
import { userSessionMap } from "./user-session-map"

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

export const sessionMiddleware: SocketServerMiddleware = (socket, next) => {
	const { username, sessionKey } = socket.handshake.auth as {
		username: string
		sessionKey: string
	}
	if (!(username && sessionKey)) {
		next(new Error(`No auth header provided`))
		return
	}
	const userKey = `user::${username}` satisfies UserKey
	const socketKey = `socket::${socket.id}` satisfies SocketKey

	const userSessions = userSessionMap.get(username)
	if (userSessions?.has(sessionKey)) {
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

export const serveSocket = (socket: Socket): void => {
	const syncContinuity = prepareToExposeRealtimeContinuity({
		socket,
		store: IMPLICIT.STORE,
	})
	const cleanup = syncContinuity(countContinuity)
	socket.on(`disconnect`, () => {
		const socketKey = `socket::${socket.id}` satisfies SocketKey
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
		cleanup()
	})
}
