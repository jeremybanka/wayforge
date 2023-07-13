import { isString } from "fp-ts/lib/string"
import type { Socket, Server as WebSocketServer } from "socket.io"

import type { ErrorObject } from "~/packages/anvl/src/json-api"
import { hasExactProperties } from "~/packages/anvl/src/object/refinement"

export type ClienteleError = ErrorObject<`title`>

export const ClienteleError = (value: unknown): value is ClienteleError =>
	hasExactProperties({
		type: (a: unknown): a is `error` => `error` === a,
		title: isString,
	})(value)

export type Clientele = {
	/* prettier-ignore */
	// server "on" / client "emit"
	ClientEvents: {
		error: (error: ClienteleError) => void
	}
	/* prettier-ignore */
	// server "emit" / client "on"
	ServerEvents: {
		connection: (socket: Socket) => void
	}
	ServerSideEvents: Record<keyof any, unknown>
}

type ClienteleSocketServer = WebSocketServer<
	Clientele[`ClientEvents`],
	Clientele[`ServerEvents`],
	Clientele[`ServerSideEvents`]
>
export const serveSimpleGit = <YourServer extends WebSocketServer>(
	server: YourServer,
): ClienteleSocketServer & YourServer =>
	server.on(`connection`, (socket) => {
		socket.on(`error`, (error) => {
			console.error(`client error`, error)
		})
	}) as ClienteleSocketServer & YourServer
