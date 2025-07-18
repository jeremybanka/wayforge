import { Join } from "anvl/join"
import type { JsonSchema } from "anvl/json-schema"
import { isJsonSchema } from "anvl/json-schema"
import type { AtomEffect } from "atom.io"
import type { Json, JsonInterface } from "atom.io/json"
import { identity } from "fp-ts/function"
import type { Refinement } from "fp-ts/Refinement"
import type { Socket } from "socket.io-client"

import type { FilestoreClientEvents, FilestoreServerEvents } from "./interface"

export type * from "./interface"

export type FilestoreClientSocket = Socket<
	FilestoreServerEvents,
	FilestoreClientEvents
>

export type SocketSyncOptions = {
	id: string
	type: string
	socket: FilestoreClientSocket
}

export const socketSync: <T>(
	options: T extends Json.Serializable
		? SocketSyncOptions
		: JsonInterface<T> & SocketSyncOptions,
) => AtomEffect<T> = (options) =>
	// @ts-expect-error typescript isn't smart enough to get this idea
	smartSocketSync({ toJson: identity, fromJson: identity, ...options })

export const smartSocketSync = <T>(
	options: JsonInterface<T> & SocketSyncOptions,
): AtomEffect<T> => {
	const { id, type, socket, toJson, fromJson } = options
	return ({ setSelf, onSet }) => {
		socket.emit(`read`, { id, type })
		socket.on(`read_${id}`, (json) => {
			setSelf(fromJson(json))
		})
		onSet(({ newValue }) =>
			socket.emit(`write`, { id, type, value: toJson(newValue) }),
		)
	}
}

export type SocketIndexOptions<T> = {
	type: string
	socket: Socket<FilestoreServerEvents, FilestoreClientEvents>
	jsonInterface: JsonInterface<T, Json.Array<string>>
}

export const socketIndex: <IDS extends Iterable<string>>(
	options: SocketIndexOptions<IDS>,
) => AtomEffect<IDS> =
	({ type, socket, jsonInterface: { toJson, fromJson } }) =>
	({ setSelf, onSet }) => {
		socket.emit(`indexRead`, { type })
		socket.on(`indexRead_${type}`, (json) => {
			setSelf(fromJson(json))
		})
		onSet(({ newValue }) =>
			socket.emit(`indexWrite`, { type, value: toJson(newValue) }),
		)
	}

export type SocketRelationsOptions<CONTENT extends Json.Object | null = null> =
	(CONTENT extends null
		? {
				refineContent: null
			}
		: {
				refineContent: Refinement<unknown, CONTENT>
			}) & {
		id: string
		type: string
		socket: Socket<FilestoreServerEvents, FilestoreClientEvents>
		a: string
		b: string
	}

export const socketRelations =
	<CONTENT extends Json.Object | null, A extends string, B extends string>({
		type,
		id,
		socket,
		refineContent,
		a,
		b,
	}: SocketRelationsOptions<CONTENT>): AtomEffect<Join<CONTENT, A, B>> =>
	({ setSelf, onSet }) => {
		socket.emit(`relationsRead`, { type, id })
		socket.on(`relationsRead_${type}_${id}`, (json) => {
			setSelf(
				Join.fromJSON<CONTENT, A, B>(json, {
					isContent: refineContent as Refinement<unknown, CONTENT>,
					from: a as A,
					to: b as B,
				}),
			)
		})
		onSet(({ newValue }) =>
			socket.emit(`relationsWrite`, { id, type, value: newValue.toJSON() }),
		)
	}

export type SocketSchemaOptions = {
	type: string
	socket: Socket<FilestoreServerEvents, FilestoreClientEvents>
}

export const socketSchema: (
	options: SocketSchemaOptions,
) => AtomEffect<JsonSchema> =
	({ type, socket }) =>
	({ setSelf, onSet }) => {
		socket.emit(`schemaRead`, { type })
		socket.on(`schemaRead_${type}`, (json) => {
			if (isJsonSchema(json)) {
				setSelf(json)
			}
		})
		onSet((_) => {
			console.warn(`editing schema not yet supported`)
		})
	}
