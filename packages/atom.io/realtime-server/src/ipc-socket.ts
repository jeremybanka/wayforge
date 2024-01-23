import type { ChildProcessWithoutNullStreams } from "child_process"

import { type Json, type Stringified, parseJson } from "atom.io/json"

import type { Socket } from "."

export function parentIPC(process: ChildProcessWithoutNullStreams): Socket {
	const id = process.pid?.toString()
	if (!id) {
		throw new Error(`Process ID not found`)
	}
	return {
		id,
		on: process.on.bind(process),
		off: process.off.bind(process),
		emit: process.emit.bind(process),
	}
}

export type Events = Json.Object<string, Json.Array>

export type StringifiedEvent<
	Key extends string,
	Params extends Json.Array,
> = Stringified<[Key, ...Params]>

export interface EventBuffer<Key extends string, Params extends Json.Array>
	extends Buffer {
	toString(): StringifiedEvent<Key, Params>
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

		process.stdin.on(`end`, () => {
			// Handle end of communication
			cleanupResources()
			process.exit(0) // Exit if there are no more events to process
		})

		process.on(`SIGINT`, () => {
			// Handle graceful shutdown on interrupt signal
			cleanupResources()
			process.exit(0)
		})

		function cleanupResources() {
			// Cleanup resources if needed
			console.log(`Cleaning up resources before exit`)
		}

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
