import { ChildProcess } from "node:child_process"
import * as http from "node:http"

import type { RenderResult } from "@testing-library/react"
import { prettyDOM, render } from "@testing-library/react"
import * as AtomIO from "atom.io"
import type { Store } from "atom.io/internal"
import {
	clearStore,
	editRelationsInStore,
	findInStore,
	findRelationsInStore,
	getFromStore,
	IMPLICIT,
	setIntoStore,
} from "atom.io/internal"
import { toEntries } from "atom.io/json"
import * as AR from "atom.io/react"
import type * as RT from "atom.io/realtime"
import * as RTC from "atom.io/realtime-client"
import * as RTR from "atom.io/realtime-react"
import * as RTS from "atom.io/realtime-server"
import { UList } from "atom.io/transceivers/u-list"
import * as Happy from "happy-dom"
import * as React from "react"
import * as SocketIO from "socket.io"
import type { Socket as ClientSocket } from "socket.io-client"
import { io } from "socket.io-client"

let testNumber = 0

/* eslint-disable no-console */

function prefixLogger(store: Store, prefix: string) {
	store.loggers[0] = new AtomIO.AtomIOLogger(
		`info`,
		(...params) => {
			let idx = 0
			for (const param of params) {
				if (param instanceof SocketIO.Socket) {
					params[idx] = `Socket:${param.id}`
				}
				if (param instanceof RTS.ChildSocket) {
					params[idx] = `ChildSocket:${param.id}`
				}
				if (param instanceof ChildProcess) {
					params[idx] = `ChildProcess:${param.pid}`
				}
				if (param instanceof UList) {
					params[idx] = `UList(${param.size}) {${[...param].join(`, `)}}`
				}
				idx++
			}
			return params
		},
		{
			info: AtomIO.simpleLog(`info`, prefix),
			warn: AtomIO.simpleLog(`warn`, prefix),
			error: AtomIO.simpleLog(`error`, prefix),
		},
	)
}

export type TestSetupOptions = {
	immortal?: { server?: boolean }
	server: (tools: {
		socket: SocketIO.Socket
		silo: AtomIO.Silo
		userKey: RT.UserKey
		enableLogging: () => void
	}) => (() => void) | void
}
export type TestSetupOptions__SingleClient = TestSetupOptions & {
	client: React.FC
}
export type TestSetupOptions__MultiClient<ClientNames extends string> =
	TestSetupOptions & {
		clients: {
			[K in ClientNames]: React.FC
		}
	}

export type RealtimeTestTools = {
	name: string
	silo: AtomIO.Silo
}
export type RealtimeTestClient = RealtimeTestTools & {
	renderResult: RenderResult
	prettyPrint: () => void
	enableLogging: () => void
	socket: ClientSocket
}
export type RealtimeTestClientBuilder = {
	dispose: () => void
	init: () => RealtimeTestClient
}

export type RealtimeTestServer = RealtimeTestTools & {
	dispose: () => Promise<void>
	port: number
}

export type RealtimeTestAPI = {
	server: RealtimeTestServer
	teardown: () => Promise<void>
}
export type RealtimeTestAPI__SingleClient = RealtimeTestAPI & {
	client: RealtimeTestClientBuilder
}
export type RealtimeTestAPI__MultiClient<ClientNames extends string> =
	RealtimeTestAPI & {
		clients: Record<ClientNames, RealtimeTestClientBuilder>
	}

export const setupRealtimeTestServer = (
	options: TestSetupOptions,
): RealtimeTestServer => {
	++testNumber
	const silo = new AtomIO.Silo(
		{
			name: `SERVER-${testNumber}`,
			lifespan: options.immortal?.server ? `immortal` : `ephemeral`,
			isProduction: false,
		},
		IMPLICIT.STORE,
	)
	// prefixLogger(silo.store, `server`)
	const socketRealm = new AtomIO.Realm<RTS.SocketSystemHierarchy>(silo.store)

	const httpServer = http.createServer((_, res) => res.end(`Hello World!`))
	const address = httpServer.listen().address()
	const port =
		typeof address === `string` ? null : address === null ? null : address.port
	if (port === null) throw new Error(`Could not determine port for test server`)

	const server = new SocketIO.Server(httpServer).use((socket, next) => {
		const { token, username } = socket.handshake.auth
		if (token === `test` && socket.id) {
			const userClaim = socketRealm.allocate(`root`, username as RT.UserKey)
			const socketClaim = socketRealm.allocate(`root`, `socket::${socket.id}`)
			const socketState = findInStore(silo.store, RTS.socketAtoms, socketClaim)
			setIntoStore(silo.store, socketState, socket)
			editRelationsInStore(silo.store, RTS.usersOfSockets, (relations) => {
				relations.set(userClaim, socketClaim)
			})
			setIntoStore(silo.store, RTS.userKeysAtom, (index) => index.add(userClaim))
			setIntoStore(silo.store, RTS.socketKeysAtom, (index) =>
				index.add(socketClaim),
			)
			next()
		} else {
			next(new Error(`Authentication error`))
		}
	})

	const socketServices = new Set<() => void>()
	const disposeAllSocketServices = () => {
		for (const disposeService of socketServices) disposeService()
	}

	server.on(`connection`, (socket: SocketIO.Socket) => {
		const userKeyState = findRelationsInStore(
			silo.store,
			RTS.usersOfSockets,
			`socket::${socket.id}`,
		).userKeyOfSocket
		const userKey = getFromStore(silo.store, userKeyState)!
		function enableLogging() {
			prefixLogger(silo.store, `server`)
			socket.onAny((event, ...args) => {
				console.log(`🛰 `, userKey, event, ...args)
			})
			socket.onAnyOutgoing((event, ...args) => {
				console.log(`🛰  >>`, userKey, event, ...args)
			})
			socket.on(`disconnect`, () => {
				console.log(`${userKey} disconnected`)
			})
		}
		const disposeServices = options.server({
			socket,
			enableLogging,
			silo,
			userKey,
		})
		if (disposeServices) {
			socketServices.add(disposeServices)
			socket.on(`disconnect`, disposeServices)
		}
	})

	const dispose = async () => {
		disposeAllSocketServices()
		await server.close()

		// const roomKeys = getFromStore(silo.store, RT.roomIndex)
		// for (const roomKey of roomKeys) {
		// 	const roomState = findInStore(silo.store, RTS.roomSelectors, roomKey)
		// 	const room = getFromStore(silo.store, roomState)
		// 	if (room && !(room instanceof Promise)) {
		// 		room.process.kill()
		// 	}
		// } // ❗ POSSIBLY STILL NEEDED
		silo.store.valueMap.clear()
	}

	return {
		name: `SERVER`,
		silo,
		dispose,
		port,
	}
}
export const setupRealtimeTestClient = (
	options: TestSetupOptions__SingleClient,
	name: string,
	port: number,
): RealtimeTestClientBuilder => {
	const testClient = { dispose: () => {} }
	const init = () => {
		const socket: ClientSocket = io(`http://localhost:${port}/`, {
			auth: { token: `test`, username: `user::${name}-${testNumber}` },
		})
		const silo = new AtomIO.Silo(
			{ name, lifespan: `ephemeral`, isProduction: false },
			IMPLICIT.STORE,
		)

		const { document } = new Happy.Window()
		document.body.innerHTML = `<div id="app"></div>`
		const renderResult = render(
			<AR.StoreProvider store={silo.store}>
				<RTR.RealtimeProvider socket={socket}>
					<options.client />
				</RTR.RealtimeProvider>
			</AR.StoreProvider>,
			{
				container: document.querySelector(`#app`) as unknown as HTMLElement,
			},
		)

		const prettyPrint = () => {
			console.log(prettyDOM(renderResult.container))
		}

		const enableLogging = () => {
			// prefixLogger(silo.store, name)
			socket.onAny((event, ...args) => {
				console.log(`📡 `, name, event, ...args)
			})
			socket.onAnyOutgoing((event, ...args) => {
				console.log(`📡  >>`, name, event, ...args)
			})
		}

		const dispose = () => {
			renderResult.unmount()
			socket.disconnect()
			clearStore(silo.store)
		}
		testClient.dispose = dispose

		return {
			name,
			silo,
			socket,
			renderResult,
			prettyPrint,
			enableLogging,
		}
	}
	return Object.assign(testClient, { init })
}

export const singleClient = (
	options: TestSetupOptions__SingleClient,
): RealtimeTestAPI__SingleClient => {
	const server = setupRealtimeTestServer(options)
	const client = setupRealtimeTestClient(options, `CLIENT`, server.port)

	return {
		client,
		server,
		teardown: async () => {
			await server.dispose()
			client.dispose()
		},
	}
}

export const multiClient = <ClientNames extends string>(
	options: TestSetupOptions__MultiClient<ClientNames>,
): RealtimeTestAPI__MultiClient<ClientNames> => {
	const server = setupRealtimeTestServer(options)
	const clients = toEntries(options.clients).reduce(
		(clientRecord, [name, client]) => {
			clientRecord[name] = setupRealtimeTestClient(
				{ ...options, client },
				name,
				server.port,
			)
			return clientRecord
		},
		{} as Record<ClientNames, RealtimeTestClientBuilder>,
	)

	return {
		clients,
		server,
		teardown: async () => {
			await server.dispose()
			for (const [, client] of toEntries(clients)) {
				client.dispose()
			}
		},
	}
}
