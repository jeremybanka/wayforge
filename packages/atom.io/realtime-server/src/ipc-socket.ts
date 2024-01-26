import type { ChildProcessWithoutNullStreams } from "child_process"

import { Subject } from "atom.io/internal"
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

export class CustomSocket<I extends Events, O extends Events> implements Socket {
	protected listeners: Map<keyof I, Set<(...args: Json.Array) => void>>
	protected globalListeners: Set<(event: string, ...args: Json.Array) => void>
	protected handleEvent<Event extends keyof I>(
		event: string,
		...args: I[Event]
	): void {
		process.stderr.write(`👩 handling ${event} ${JSON.stringify(args)}\n`)
		//listeners
		process.stderr.write(`👩 ${JSON.stringify(this.listeners.entries())}\n`)
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

export class ChildSocket<
	I extends Events,
	O extends Events & {
		/* eslint-disable quotes */
		"setup-relay": [string]
		/* eslint-enable quotes */
	},
> extends CustomSocket<I, O> {
	protected process: ChildProcessWithoutNullStreams

	public id = `no_id_retrieved`

	public constructor(process: ChildProcessWithoutNullStreams) {
		super((event, ...args) => {
			const stringifiedEvent = JSON.stringify([event, ...args]) + `\n`
			this.process.stdin.write(stringifiedEvent)
			return this
		})
		this.process = process
		this.process.stdout.on(
			`data`,
			<Event extends keyof I>(buffer: EventBuffer<string, I[Event]>) => {
				const stringifiedEvent = buffer.toString()
				const parsedEvent = parseJson(stringifiedEvent)
				this.handleEvent(...parsedEvent)
			},
		)
		if (process.pid) {
			this.id = process.pid.toString()
		}
	}
}

export class SubjectSocket<
	I extends Events,
	O extends Events,
> extends CustomSocket<I, O> {
	public in: Subject<[string, ...Json.Serializable[]]>
	public out: Subject<[string, ...Json.Serializable[]]>
	public id = `no_id_retrieved`

	public constructor(id: string) {
		super((...args) => {
			process.stderr.write(`👩 relay emitting ${JSON.stringify(args)}\n`)
			this.out.next(args as any)
			return this
		})
		this.id = id
		this.in = new Subject()
		this.out = new Subject()
		this.in.subscribe(`socket`, (event) => {
			process.stderr.write(`👷 ${JSON.stringify(event)}\n`)
			this.handleEvent(...(event as [string, ...I[keyof I]]))
		})
	}
}

export class ParentSocket<
	I extends Events & {
		[id in string as `relay:${id}`]: [string, ...Json.Serializable[]]
	} & {
		/* eslint-disable quotes */
		"setup-relay": [string]
		/* eslint-enable quotes */
	},
	O extends Events & {
		[id in string as `relay:${id}`]: [string, ...Json.Serializable[]]
	},
> extends CustomSocket<I, O> {
	protected queue: string[]
	protected relays: Map<string, SubjectSocket<any, any>>
	protected relayServices: ((
		socket: SubjectSocket<any, any>,
	) => (() => void) | void)[]
	protected process: NodeJS.Process

	public id = `no_id_retrieved`

	public constructor() {
		super((event, ...args) => {
			const stringifiedEvent = JSON.stringify([event, ...args])
			this.process.stdout.write(stringifiedEvent)
			return this
		})
		this.process = process
		this.process.stdin.resume()
		this.queue = []
		this.relays = new Map()
		this.relayServices = []

		this.process.stdin.on(
			`data`,
			<Event extends keyof I>(chunk: EventBuffer<string, I[Event]>) => {
				const buffer = chunk.toString()
				this.queue.push(...buffer.split(`\n`))
				this.process.stderr.write(`📥 buffer ${buffer}\n`)
				this.process.stderr.write(`📥 queue ${JSON.stringify(this.queue)}\n`)
				while (this.queue.length > 0) {
					try {
						const event = this.queue.shift() as StringifiedEvent<any, any>
						if (event === ``) continue
						this.process.stderr.write(`📥 ${event}\n`)
						const parsedEvent = parseJson(event)
						this.handleEvent(...(parsedEvent as [string, ...I[keyof I]]))
					} catch (error) {
						this.process.stderr.write(`❌ ${error}\n`)
					}
				}
			},
		)

		process.stdin.on(`end`, () => process.exit(0))
		process.on(`SIGINT`, () => process.exit(0))
		if (process.pid) {
			this.id = process.pid?.toString()
		}

		this.on(`setup-relay`, (id: string) => {
			process.stderr.write(`✨ setup-relay ${id}\n`)
			const relay = new SubjectSocket(`relay:${id}`)
			this.relays.set(id, relay)
			for (const attachServices of this.relayServices) {
				attachServices(relay)
			}
			this.on(`relay:${id}`, (...data) => {
				this.process.stderr.write(`🚀 relay.in:${id} ${data[0]}\n`)
				relay.in.next(data)
			})
			relay.out.subscribe(`socket`, (data) => {
				this.process.stderr.write(`🚀 relay.out ${data[0]}\n`)
				this.emit(...(data as [string, ...O[keyof O]]))
			})
		})
	}

	public relay(
		attachServices: (socket: SubjectSocket<any, any>) => (() => void) | void,
	): void {
		this.relayServices.push(attachServices)
		const relays = this.relays.values()
		for (const relay of relays) {
			attachServices(relay)
		}
	}
}
