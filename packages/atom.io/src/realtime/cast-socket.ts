import type { Loadable } from "atom.io"
import type { Json } from "atom.io/json"

import type { EventsMap, Socket, TypedSocket } from "./socket-interface"
import type { StandardSchemaV1 } from "./standard-schema"

export type SocketListeners<T extends TypedSocket> = T extends TypedSocket<
	infer ListenEvents
>
	? ListenEvents
	: never

export type SocketGuard<L extends EventsMap> = {
	[K in keyof L]: StandardSchemaV1<Json.Array, Parameters<L[K]>>
}

export type Loaded<L extends Loadable<any>> = L extends Loadable<infer T>
	? T
	: never

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

export function castSocket<T extends TypedSocket>(
	socket: Socket,
	guard: SocketGuard<SocketListeners<T>> | `TRUST`,
	logError?: (error: unknown) => void,
): T {
	if (guard === `TRUST`) {
		return socket as T
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
		off: socket.off.bind(socket),
		offAny: socket.offAny.bind(socket),
		emit: socket.emit.bind(socket),
	}
	return guardedSocket as T
}
