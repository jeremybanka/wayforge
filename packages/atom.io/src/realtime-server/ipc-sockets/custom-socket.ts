import type { Json, stringified } from "atom.io/json"
import type { Socket } from "atom.io/realtime"

export type Events = Json.Object<string, Json.Serializable[]>

export type EventPayload<
	receiveRelay extends Events,
	K extends string & keyof receiveRelay = string & keyof receiveRelay,
> = [string, ...receiveRelay[K]]

export interface EventBuffer<
	E extends Events,
	K extends string & keyof E = string & keyof E,
> extends Buffer {
	toString(): stringified<EventPayload<E, K>>
}

export abstract class CustomSocket<I extends Events, O extends Events>
	implements Socket
{
	protected listeners: Map<keyof O, Set<(...args: Json.Array) => void>>
	protected globalListeners: Set<(event: string, ...args: Json.Array) => void>
	protected globalListenersOutgoing: Set<
		(event: string, ...args: Json.Array) => void
	>
	protected handleEvent<K extends string & keyof I>(
		...args: EventPayload<I, K>
	): void {
		const [event, ...rest] = args
		for (const listener of this.globalListeners) {
			listener(event, ...rest)
		}
		const listeners = this.listeners.get(event)
		if (listeners) {
			for (const listener of listeners) {
				listener(...rest)
			}
		}
	}

	public id = `no_id_retrieved`
	public emit: <Event extends string & keyof I>(
		event: Event,
		...args: I[Event]
	) => CustomSocket<I, O>

	public constructor(
		emit: <Event extends keyof I>(
			event: Event,
			...args: I[Event]
		) => CustomSocket<I, O>,
	) {
		this.emit = (...args) => {
			for (const listener of this.globalListenersOutgoing) {
				listener(...args)
			}
			return emit(...args)
		}
		this.listeners = new Map()
		this.globalListeners = new Set()
		this.globalListenersOutgoing = new Set()
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

	public onAnyOutgoing(
		listener: (event: string, ...args: Json.Array) => void,
	): this {
		this.globalListenersOutgoing.add(listener)
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
