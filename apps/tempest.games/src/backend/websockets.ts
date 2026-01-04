import { type } from "arktype"
import { disposeState, findState, selectorFamily, setState } from "atom.io"
import { IMPLICIT } from "atom.io/internal"
import { mutualUsersSelector, type UserKey } from "atom.io/realtime"
import type { Handshake, UserServerConfig } from "atom.io/realtime-server"
import {
	provideRooms,
	realtimeAtomFamilyProvider,
	realtimeStateProvider,
} from "atom.io/realtime-server"
import { CookieMap } from "bun"
import { and, eq } from "drizzle-orm"

import { resolveRoomScript } from "../backend.worker"
import { users, userSessions } from "../database/tempest-db-schema"
import { usernameType } from "../library/data-constraints"
import { env } from "../library/env"
import { roomNames } from "../library/room-names"
import { cpuCountAtom } from "../library/store"
import { usernameAtoms } from "../library/username-state"
import { db } from "./db"
import { logger } from "./logger"

const handshakeSchema = type({
	auth: type({ username: usernameType }),
	headers: type({ cookie: `string` }),
})

export const sessionMiddleware = async (
	handshake: Handshake,
): Promise<Error | UserKey> => {
	const handshakeResult = handshakeSchema(handshake)
	if (handshakeResult instanceof type.errors) {
		return new Error(`Handshake failed validation: ${handshakeResult.summary}`)
	}
	const {
		auth: { username },
		headers: { cookie },
	} = handshakeResult
	const cookies = new CookieMap(cookie)
	const sessionKey = cookies.get(`sessionKey`)
	if (sessionKey === null) {
		return new Error(`No sessionKey cookie was provided`)
	}
	const user = await db.drizzle.query.users.findFirst({
		where: eq(users.username, username),
	})
	if (user === undefined) {
		return new Error(`User not found`)
	}
	const session = await db.drizzle.query.userSessions.findFirst({
		where: and(
			eq(userSessions.userId, user.id),
			eq(userSessions.sessionKey, sessionKey),
		),
	})
	if (session === undefined) {
		return new Error(`User passed an invalid sessionKey`)
	}
	if (user.emailVerified === null) {
		return new Error(`User does not have a verified email`)
	}
	return `user::${user.id}` satisfies UserKey
}

export const roomAdminsSelectors = selectorFamily<boolean, UserKey>({
	key: `roomAdmins`,
	get:
		(userKey) =>
		({ get }) => {
			const userName = get(usernameAtoms, userKey)
			if (userName === env.ROOT_USERNAME) return true
			return false
		},
})

export const serveSocket = (config: UserServerConfig): (() => void) => {
	const { socket, consumer } = config
	socket.onAny((event, ...args) => {
		logger.info(`📡 >> 🛰️`, socket.id, consumer, { event, args })
	})
	socket.onAnyOutgoing((event, ...args) => {
		logger.info(`🛰️ >> 📡`, socket.id, consumer, { event, args })
	})
	const provideState = realtimeStateProvider(config)
	const provideFamily = realtimeAtomFamilyProvider(config)

	const mutualsSelector = findState(mutualUsersSelector, consumer)

	const unsubFunctions = [
		provideState(cpuCountAtom),
		provideFamily(usernameAtoms, mutualsSelector),
		provideRooms({
			socket,
			userKey: consumer,
			store: IMPLICIT.STORE,
			roomNames: roomNames,
			resolveRoomScript,
			roomAdminsToken: roomAdminsSelectors,
		}),
	]

	const rawUserId = consumer.replace(/^user::/, ``)
	socket.on(`changeUsername`, async (usernameAttempt) => {
		const username = usernameType(usernameAttempt)
		if (username instanceof type.errors) {
			logger.error(`❌ invalid username`, username.summary)
			return
		}
		await db.drizzle
			.update(users)
			.set({ username })
			.where(eq(users.id, rawUserId))
		setState(usernameAtoms, consumer, username)
		socket.emit(`usernameChanged`, username)
	})

	return () => {
		for (const unsub of unsubFunctions) unsub()
		disposeState(usernameAtoms, consumer)
		disposeState(mutualUsersSelector, consumer)
	}
}
