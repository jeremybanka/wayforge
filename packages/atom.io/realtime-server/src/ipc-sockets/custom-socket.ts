import type { Json, Stringified } from "atom.io/json"

import type { Socket } from ".."

export type Events = Json.Object<string, Json.Serializable[]>

export type StringifiedEvent<
	Key extends string,
	Params extends Json.Serializable[],
> = Stringified<[Key, ...Params]>

export interface EventBuffer<
	Key extends string,
	Params extends Json.Serializable[],
> extends Buffer {
	toString(): StringifiedEvent<Key, Params>
}

export class CustomSocket<I extends Events, O extends Events> implements Socket {
	protected listeners: Map<keyof I, Set<(...args: Json.Array) => void>>
	protected globalListeners: Set<(event: string, ...args: Json.Array) => void>
	protected handleEvent<Event extends keyof I>(
		event: string,
		...args: I[Event]
	): void {
		for (const listener of this.globalListeners) {
			listener(event, ...args)
		}
		const listeners = this.listeners.get(event)
		if (listeners) {
			for (const listener of listeners) {
				listener(...args)
			}
		}
	}

	public id = `no_id_retrieved`

	public constructor(
		public emit: <Event extends keyof O>(
			event: Event,
			...args: O[Event]
		) => CustomSocket<I, O>,
	) {
		this.listeners = new Map()
		this.globalListeners = new Set()
	}

	public on<Event extends keyof I>(
		event: Event,
		listener: (...args: I[Event]) => void,
	): CustomSocket<I, O> {
		const listeners = this.listeners.get(event)
		if (listeners) {
			listeners.add(listener)
		} else {
			this.listeners.set(event, new Set([listener]))
		}
		return this
	}

	public onAny(
		listener: (event: string, ...args: Json.Array) => void,
	): CustomSocket<I, O> {
		this.globalListeners.add(listener)
		return this
	}

	public off<Event extends keyof I>(
		event: Event,
		listener: (...args: I[Event]) => void,
	): CustomSocket<I, O> {
		const listeners = this.listeners.get(event)
		if (listeners) {
			listeners.delete(listener)
		}
		return this
	}

	public offAny(
		listener: (event: string, ...args: Json.Array) => void,
	): CustomSocket<I, O> {
		this.globalListeners.delete(listener)
		return this
	}
}
