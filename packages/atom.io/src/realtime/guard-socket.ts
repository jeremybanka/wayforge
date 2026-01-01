import type { Loadable } from "atom.io"
import type { Json } from "atom.io/json"

import type { EventsMap, GuardedSocket, Socket } from "./socket-interface"
import type { StandardSchemaV1 } from "./standard-schema"

export type SocketGuard<ListenEvents extends EventsMap> = {
	[K in keyof ListenEvents]: StandardSchemaV1<
		Json.Array,
		Parameters<ListenEvents[K]>
	>
}

export type Loaded<L extends Loadable<any>> =
	L extends Loadable<infer T> ? T : never

function onLoad<L extends Loadable<any>>(
	loadable: L,
	fn: (loaded: Loaded<L>) => any,
): void {
	if (loadable instanceof Promise) {
		void loadable.then(fn)
	} else {
		fn(loadable as Loaded<L>)
	}
}

export function guardSocket<ListenEvents extends EventsMap>(
	socket: Socket,
	guard: SocketGuard<ListenEvents> | `TRUST`,
	logError?: (error: unknown) => void,
): GuardedSocket<ListenEvents> {
	if (guard === `TRUST`) {
		return socket as GuardedSocket<ListenEvents>
	}
	const guardedSocket: Socket = {
		id: socket.id,
		on: (event, listener) => {
			const schema = guard[event] as StandardSchemaV1<Json.Array, Json.Array>
			socket.on(event, (...args) => {
				const loadableResult = schema[`~standard`].validate(args)
				onLoad(loadableResult, (result) => {
					if (result.issues) {
						logError?.(result.issues)
					} else {
						listener(...result.value)
					}
				})
			})
		},
		onAny: (listener) => {
			socket.onAny((event, ...args) => {
				const schema = guard[event] as StandardSchemaV1<unknown, Json.Array>
				const loadableResult = schema[`~standard`].validate(args)
				onLoad(loadableResult, (result) => {
					if (result.issues) {
						logError?.(result.issues)
					} else {
						listener(event, ...result.value)
					}
				})
			})
		},
		onAnyOutgoing: socket.onAnyOutgoing.bind(socket),
		off: socket.off.bind(socket),
		offAny: socket.offAny.bind(socket),
		emit: socket.emit.bind(socket),
	}
	return guardedSocket as GuardedSocket<ListenEvents>
}
