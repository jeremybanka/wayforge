import type { IncomingHttpHeaders } from "node:http"
import type { ParsedUrlQuery } from "node:querystring"

import { Realm } from "atom.io"
import type { RootStore } from "atom.io/internal"
import {
	editRelationsInStore,
	findInStore,
	findRelationsInStore,
	getFromStore,
	IMPLICIT,
	setIntoStore,
} from "atom.io/internal"
import type { Socket, SocketKey, UserKey } from "atom.io/realtime"
import type { Server } from "socket.io"

import type { SocketSystemHierarchy } from "./realtime-server-stores/server-user-store"
import {
	socketAtoms,
	socketKeysAtom,
	userKeysAtom,
	usersOfSockets,
} from "./realtime-server-stores/server-user-store"
import { realtimeStateProvider } from "./realtime-state-provider"

export type ServerConfig = {
	socket: Socket
	userKey: UserKey
	store?: RootStore
}

/** Socket Handshake details--taken from socket.io */
export type Handshake = {
	/** The headers sent as part of the handshake */
	headers: IncomingHttpHeaders
	/** The date of creation (as string) */
	time: string
	/** The ip of the client */
	address: string
	/** Whether the connection is cross-domain */
	xdomain: boolean
	/** Whether the connection is secure */
	secure: boolean
	/** The date of creation (as unix timestamp) */
	issued: number
	/** The request URL string */
	url: string
	/** The query object */
	query: ParsedUrlQuery
	/** The auth object */
	auth: {
		[key: string]: any
	}
}

export function realtime(
	server: Server,
	auth: (handshake: Handshake) => Error | UserKey,
	onConnect: (config: ServerConfig) => () => void,
	store: RootStore = IMPLICIT.STORE,
): () => Promise<void> {
	const socketRealm = new Realm<SocketSystemHierarchy>(store)

	server
		.use((socket, next) => {
			const result = auth(socket.handshake)
			if (result instanceof Error) {
				next(result)
				return
			}
			const userClaim = socketRealm.allocate(`root`, result)
			const socketClaim = socketRealm.allocate(`root`, `socket::${socket.id}`)
			const socketState = findInStore(store, socketAtoms, socketClaim)
			setIntoStore(store, socketState, socket)
			editRelationsInStore(store, usersOfSockets, (relations) => {
				relations.set(userClaim, socketClaim)
			})
			setIntoStore(store, userKeysAtom, (index) => index.add(userClaim))
			setIntoStore(store, socketKeysAtom, (index) => index.add(socketClaim))
			next()
		})
		.on(`connection`, (socket) => {
			const socketKey = `socket::${socket.id}` satisfies SocketKey
			const userKeyState = findRelationsInStore(
				store,
				usersOfSockets,
				socketKey,
			).userKeyOfSocket
			const userKey = getFromStore(store, userKeyState)!
			const serverConfig: ServerConfig = { store, socket, userKey }
			const provideState = realtimeStateProvider(serverConfig)
			const unsubFromMyUserKey = provideState(
				{ key: `myUserKey`, type: `atom` },
				userKey,
			)

			const disposeServices = onConnect(serverConfig)

			socket.on(`disconnect`, () => {
				store.logger.info(`📡`, `socket`, socketKey, `👤 ${userKey} disconnects`)
				disposeServices()
				unsubFromMyUserKey()
				editRelationsInStore(store, usersOfSockets, (rel) =>
					rel.delete(socketKey),
				)
				setIntoStore(store, userKeysAtom, (keys) => (keys.delete(userKey), keys))
				setIntoStore(
					store,
					socketKeysAtom,
					(keys) => (keys.delete(socketKey), keys),
				)
			})
		})

	const disposeAll = async () => {
		await server.close()
	}
	return disposeAll
}
