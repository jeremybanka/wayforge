import type { ChildProcessWithoutNullStreams } from "child_process"

import { parseJson } from "atom.io/json"
import type { Json, Stringified } from "atom.io/json"

import type { Socket } from "."

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

export class ChildSocket<I extends Events, O extends Events> implements Socket {
	protected process: ChildProcessWithoutNullStreams
	protected listeners: Map<keyof I, Set<(...args: Json.Array) => void>>
	protected globalListeners: Set<(event: string, ...args: Json.Array) => void>

	public id = `no_id_retrieved`

	public constructor(process: ChildProcessWithoutNullStreams) {
		this.process = process
		this.listeners = new Map()
		this.globalListeners = new Set()
		this.process.stdout.on(
			`data`,
			<Event extends keyof I>(buffer: EventBuffer<string, I[Event]>) => {
				const stringifiedEvent = buffer.toString()
				const parsedEvent = parseJson(stringifiedEvent)
				const [key, ...params] = parsedEvent
				const listeners = this.listeners.get(key)
				if (listeners) {
					for (const listener of listeners) {
						listener(...params)
					}
				}
				for (const listener of this.globalListeners) {
					listener(key, ...params)
				}
			},
		)

		this.id = process.pid?.toString() ?? `process`
	}

	public on<Event extends keyof I>(
		event: Event,
		listener: (...args: I[Event]) => void,
	): ChildSocket<I, O> {
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
	): ChildSocket<I, O> {
		this.globalListeners.add(listener)
		return this
	}

	public off<Event extends keyof I>(
		event: Event,
		listener: (...args: I[Event]) => void,
	): ChildSocket<I, O> {
		const listeners = this.listeners.get(event)
		if (listeners) {
			listeners.delete(listener)
		}
		return this
	}

	public offAny(
		listener: (event: string, ...args: Json.Array) => void,
	): ChildSocket<I, O> {
		this.globalListeners.delete(listener)
		return this
	}

	public emit<Event extends keyof O>(
		event: Event,
		...args: O[Event]
	): ChildSocket<I, O> {
		const stringifiedEvent = JSON.stringify([event, ...args])
		this.process.stdin.write(stringifiedEvent)
		return this
	}
}

export class ParentSocket<I extends Events, O extends Events> implements Socket {
	protected process: NodeJS.Process
	protected listeners: Map<keyof I, Set<(...args: Json.Array) => void>>

	public id = `no_id_retrieved`

	public constructor() {
		this.process = process
		this.process.stdin.resume()
		this.listeners = new Map()

		this.process.stdin.on(
			`data`,
			<Event extends keyof I>(buffer: EventBuffer<string, I[Event]>) => {
				const stringifiedEvent = buffer.toString()
				const parsedEvent = parseJson(stringifiedEvent)
				const [key, ...params] = parsedEvent
				const listeners = this.listeners.get(key)
				if (listeners) {
					for (const listener of listeners) {
						listener(...params)
					}
				}
			},
		)

		process.stdin.on(`end`, () => process.exit(0))
		process.on(`SIGINT`, () => process.exit(0))

		this.id = process.pid?.toString() ?? `process`
	}

	public on<Event extends keyof I>(
		event: Event,
		listener: (...args: I[Event]) => void,
	): ParentSocket<I, O> {
		const listeners = this.listeners.get(event)
		if (listeners) {
			listeners.add(listener)
		} else {
			this.listeners.set(event, new Set([listener]))
		}
		return this
	}

	public off<Event extends keyof I>(
		event: Event,
		listener: (...args: I[Event]) => void,
	): ParentSocket<I, O> {
		const listeners = this.listeners.get(event)
		if (listeners) {
			listeners.delete(listener)
		}
		return this
	}

	public emit<Event extends keyof O>(
		event: Event,
		...args: O[Event]
	): ParentSocket<I, O> {
		const stringifiedEvent = JSON.stringify([event, ...args])
		this.process.stdout.write(stringifiedEvent)
		return this
	}
}
