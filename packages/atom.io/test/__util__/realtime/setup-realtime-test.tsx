import * as http from "http"

import * as React from "react"

import { prettyDOM, render, type RenderResult } from "@testing-library/react"
import * as AtomIO from "atom.io"
import * as AR from "atom.io/react"
import * as RTC from "atom.io/realtime-react"
import * as RR from "fp-ts/ReadonlyRecord"
import * as Happy from "happy-dom"
import * as SocketIO from "socket.io"
import type { Socket as ClientSocket } from "socket.io-client"
import { io } from "socket.io-client"

export type TestSetupOptions = {
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
	dispose: () => void
}
export type RealtimeTestClient = RealtimeTestTools & {
	renderResult: RenderResult
	prettyPrint: () => void
	reconnect: () => void
	disconnect: () => void
}
export type RealtimeTestServer = RealtimeTestTools & {
	port: number
}

export type RealtimeTestAPI = {
	server: RealtimeTestServer
	teardown: () => void
}
export type RealtimeTestAPI__SingleClient = RealtimeTestAPI & {
	client: RealtimeTestClient
}
export type RealtimeTestAPI__MultiClient<ClientNames extends string> =
	RealtimeTestAPI & {
		clients: Record<ClientNames, RealtimeTestClient>
	}

export const setupRealtimeTestServer = (
	options: TestSetupOptions,
): RealtimeTestServer => {
	const httpServer = http.createServer((_, res) => res.end(`Hello World!`))
	const address = httpServer.listen().address()
	const port =
		typeof address === `string` ? 80 : address === null ? null : address.port
	if (port === null) throw new Error(`Could not determine port for test server`)
	const server = new SocketIO.Server(httpServer)
	const silo = AtomIO.silo(`SERVER`, AtomIO.__INTERNAL__.IMPLICIT.STORE)

	server.on(`connection`, (socket: SocketIO.Socket) => {
		options.server({ socket, silo })
	})

	const dispose = () => {
		server.close()
		AtomIO.__INTERNAL__.clearStore(silo.store)
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
): RealtimeTestClient => {
	const socket: ClientSocket = io(`http://localhost:${port}/`)
	const silo = AtomIO.silo(name, AtomIO.__INTERNAL__.IMPLICIT.STORE)

	const { document } = new Happy.Window()
	document.body.innerHTML = `<div id="app"></div>`
	const renderResult = render(
		<AR.StoreProvider store={silo.store}>
			<RTC.RealtimeProvider socket={socket}>
				<options.client />
			</RTC.RealtimeProvider>
		</AR.StoreProvider>,
		{
			container: document.querySelector(`#app`) as unknown as HTMLElement,
		},
	)

	const prettyPrint = () => console.log(prettyDOM(renderResult.container))

	const disconnect = () => socket.disconnect()
	const reconnect = () => socket.connect()

	const dispose = () => {
		socket.disconnect()
		AtomIO.__INTERNAL__.clearStore(silo.store)
	}

	return {
		name,
		silo,
		renderResult,
		prettyPrint,
		disconnect,
		reconnect,
		dispose,
	}
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
			client.dispose()
			server.dispose()
		},
	}
}

export const multiClient = <ClientNames extends string>(
	options: TestSetupOptions__MultiClient<ClientNames>,
): RealtimeTestAPI__MultiClient<ClientNames> => {
	const server = setupRealtimeTestServer(options)
	const clients = RR.toEntries(options.clients).reduce(
		(clients, [name, client]) => ({
			...clients,
			[name]: setupRealtimeTestClient({ ...options, client }, name, server.port),
		}),
		{} as Record<ClientNames, RealtimeTestClient>,
	)

	return {
		clients,
		server,
		teardown: () => {
			RR.toEntries(clients).forEach(([, client]) => client.dispose())
			server.dispose()
		},
	}
}
