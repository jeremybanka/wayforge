import type { ErrorObject } from "anvl/json-api"
import { hasExactProperties } from "anvl/object"
import { isString } from "fp-ts/string"
import type { Server as WebSocketServer, Socket } from "socket.io"

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
	ServerSideEvents: Record<PropertyKey, unknown>
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
