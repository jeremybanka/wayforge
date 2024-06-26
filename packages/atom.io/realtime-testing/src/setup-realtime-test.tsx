import * as http from "node:http"

import type { RenderResult } from "@testing-library/react"
import { prettyDOM, render } from "@testing-library/react"
import * as AtomIO from "atom.io"
import { editRelationsInStore } from "atom.io/data"
import {
	clearStore,
	findInStore,
	getFromStore,
	IMPLICIT,
	setIntoStore,
} from "atom.io/internal"
import * as AR from "atom.io/react"
import * as RT from "atom.io/realtime"
import { myUsernameState } from "atom.io/realtime-client"
import * as RTR from "atom.io/realtime-react"
import * as RTS from "atom.io/realtime-server"
import * as Happy from "happy-dom"
import * as React from "react"
import * as SocketIO from "socket.io"
import type { Socket as ClientSocket } from "socket.io-client"
import { io } from "socket.io-client"

import { recordToEntries } from "~/packages/anvl/src/object"

let testNumber = 0

export type TestSetupOptions = {
	port: number
	server: (tools: { socket: SocketIO.Socket; silo: AtomIO.Silo }) => void
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
	socket: ClientSocket
}
export type RealtimeTestClientBuilder = {
	dispose: () => void
	init: () => RealtimeTestClient
}

export type RealtimeTestServer = RealtimeTestTools & {
	dispose: () => void
	port: number
}

export type RealtimeTestAPI = {
	server: RealtimeTestServer
	teardown: () => void
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
		{ name: `SERVER-${testNumber}`, lifespan: `ephemeral` },
		IMPLICIT.STORE,
	)

	const httpServer = http.createServer((_, res) => res.end(`Hello World!`))
	const address = httpServer.listen(options.port).address()
	const port =
		typeof address === `string` ? null : address === null ? null : address.port
	if (port === null) throw new Error(`Could not determine port for test server`)

	const server = new SocketIO.Server(httpServer).use((socket, next) => {
		const { token, username } = socket.handshake.auth
		if (token === `test` && socket.id) {
			const socketState = findInStore(RTS.socketAtoms, socket.id, silo.store)
			setIntoStore(socketState, socket, silo.store)
			editRelationsInStore(
				RTS.usersOfSockets,
				(relations) => {
					relations.set(socket.id, username)
				},
				silo.store,
			)
			setIntoStore(RTS.userIndex, (index) => index.add(username), silo.store)
			setIntoStore(RTS.socketIndex, (index) => index.add(socket.id), silo.store)
			console.log(`${username} connected on ${socket.id}`)
			next()
		} else {
			next(new Error(`Authentication error`))
		}
	})

	server.on(`connection`, (socket: SocketIO.Socket) => {
		options.server({ socket, silo })
	})

	const dispose = () => {
		server.close()
		const roomKeys = getFromStore(RT.roomIndex, silo.store)
		for (const roomKey of roomKeys) {
			const roomState = findInStore(RTS.roomSelectors, roomKey, silo.store)
			const room = getFromStore(roomState, silo.store)
			if (room && !(room instanceof Promise)) {
				room.process.kill()
			}
		}
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
			auth: { token: `test`, username: `${name}-${testNumber}` },
		})
		const silo = new AtomIO.Silo({ name, lifespan: `ephemeral` }, IMPLICIT.STORE)
		for (const [key, value] of silo.store.valueMap.entries()) {
			if (Array.isArray(value)) {
				silo.store.valueMap.set(key, [...value])
			}
		}
		silo.setState(myUsernameState, `${name}-${testNumber}`)

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
		teardown: () => {
			server.dispose()
			client.dispose()
		},
	}
}

export const multiClient = <ClientNames extends string>(
	options: TestSetupOptions__MultiClient<ClientNames>,
): RealtimeTestAPI__MultiClient<ClientNames> => {
	const server = setupRealtimeTestServer(options)
	const clients = recordToEntries(options.clients).reduce(
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
		teardown: () => {
			server.dispose()
			for (const [, client] of recordToEntries(clients)) {
				client.dispose()
			}
		},
	}
}
