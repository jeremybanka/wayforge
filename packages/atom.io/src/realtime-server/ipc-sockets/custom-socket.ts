import type { Json, stringified } from "atom.io/json"

import type { Socket } from "../socket-interface"

export type Events = Json.Object<string, Json.Serializable[]>

export type StringifiedEvent<
	Key extends string,
	Params extends Json.Serializable[],
> = stringified<[Key, ...Params]>

export interface EventBuffer<
	Key extends string,
	Params extends Json.Serializable[],
> extends Buffer {
	toString(): StringifiedEvent<Key, Params>
}

export class CustomSocket<I extends Events, O extends Events> implements Socket {
	protected listeners: Map<keyof O, Set<(...args: Json.Array) => void>>
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
	public emit: <Event extends keyof I>(
		event: Event,
		...args: I[Event]
	) => CustomSocket<I, O>

	public constructor(
		emit: <Event extends keyof I>(
			event: Event,
			...args: I[Event]
		) => CustomSocket<I, O>,
	) {
		this.emit = emit
		this.listeners = new Map()
		this.globalListeners = new Set()
	}

	public on<Event extends keyof O>(
		event: Event,
		listener: (...args: O[Event]) => void,
	): this {
		const listeners = this.listeners.get(event)
		if (listeners) {
			listeners.add(listener)
		} else {
			this.listeners.set(event, new Set([listener]))
		}
		return this
	}

	public onAny(listener: (event: string, ...args: Json.Array) => void): this {
		this.globalListeners.add(listener)
		return this
	}

	public off<Event extends keyof O>(
		event: Event,
		listener?: (...args: O[Event]) => void,
	): this {
		const listeners = this.listeners.get(event)
		if (listeners) {
			if (listener) {
				listeners.delete(listener)
			} else {
				this.listeners.delete(event)
			}
		}
		return this
	}

	public offAny(listener: (event: string, ...args: Json.Array) => void): this {
		this.globalListeners.delete(listener)
		return this
	}
}
