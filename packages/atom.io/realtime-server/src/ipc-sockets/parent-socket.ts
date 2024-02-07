import { IMPLICIT, Subject } from "atom.io/internal"
import { parseJson } from "atom.io/json"
import type { Json } from "atom.io/json"

import { CustomSocket } from "./custom-socket"
import type { EventBuffer, Events } from "./custom-socket"

export class SubjectSocket<
	I extends Events,
	O extends Events,
> extends CustomSocket<I, O> {
	public in: Subject<[string, ...Json.Serializable[]]>
	public out: Subject<[string, ...Json.Serializable[]]>
	public id = `no_id_retrieved`
	public disposalFunctions: (() => void)[] = []

	public constructor(id: string) {
		super((...args) => {
			this.out.next(args as any)
			return this
		})
		this.id = id
		this.in = new Subject()
		this.out = new Subject()
		this.in.subscribe(`socket`, (event) => {
			this.handleEvent(...(event as [string, ...I[keyof I]]))
		})
	}

	public dispose(): void {
		for (const dispose of this.disposalFunctions) {
			dispose()
		}
	}
}

export class ParentSocket<
	I extends Events & {
		[id in string as `relay:${id}`]: [string, ...Json.Serializable[]]
	} & {
		/* eslint-disable quotes */
		"setup-relay": [string]
		"close-relay": [string]
		/* eslint-enable quotes */
	},
	O extends Events & {
		[id in string as `relay:${id}`]: [string, ...Json.Serializable[]]
	},
> extends CustomSocket<I, O> {
	protected incompleteData = ``
	protected unprocessedEvents: string[] = []
	protected relays: Map<string, SubjectSocket<any, any>>
	protected relayServices: ((
		socket: SubjectSocket<any, any>,
	) => (() => void) | void)[]
	protected process: NodeJS.Process

	public id = `no_id_retrieved`

	public constructor() {
		super((event, ...args) => {
			const stringifiedEvent = JSON.stringify([event, ...args])
			this.process.stdout.write(stringifiedEvent + `\x03`)
			return this
		})
		this.process = process
		this.process.stdin.resume()
		this.relays = new Map()
		this.relayServices = []

		this.process.stdin.on(
			`data`,
			<Event extends keyof I>(buffer: EventBuffer<string, I[Event]>) => {
				const chunk = buffer.toString()
				this.unprocessedEvents.push(...chunk.split(`\x03`))
				const newInput = this.unprocessedEvents.shift()
				this.incompleteData += newInput || ``

				try {
					const parsedEvent = parseJson(this.incompleteData)
					IMPLICIT.STORE.logger.info(`🖥️`, `parent`, parsedEvent)
					this.handleEvent(...(parsedEvent as [string, ...I[keyof I]]))
					while (this.unprocessedEvents.length > 0) {
						const event = this.unprocessedEvents.shift()
						if (event) {
							if (this.unprocessedEvents.length === 0) {
								this.incompleteData = event
							}
							const parsedEvent = parseJson(event)
							this.handleEvent(...(parsedEvent as [string, ...I[keyof I]]))
						}
					}
					this.incompleteData = ``
				} catch (error) {
					this.process.stderr.write(`❌ ${error}\n❌ ${newInput}\n`)
				}
			},
		)

		this.on(`exit`, () => {
			process.exit(0)
		})
		process.on(`exit`, () => {
			this.process.stderr.write(`❌ ${this.id} exited\n`)
			process.exit(0)
		})
		process.on(`end`, () => {
			this.process.stderr.write(`❌ ${this.id} ended\n`)
			process.exit(0)
		})
		process.on(`SIGTERM`, () => {
			this.process.stderr.write(`❌ ${this.id} terminated\n`)
			process.exit(0)
		})
		process.on(`SIGINT`, () => {
			this.process.stderr.write(`❌ ${this.id} interrupted\n`)
			process.exit(0)
		})

		if (process.pid) {
			this.id = process.pid?.toString()
		}

		this.on(`setup-relay`, (id: string) => {
			const relay = new SubjectSocket(`relay:${id}`)
			this.relays.set(id, relay)
			for (const attachServices of this.relayServices) {
				const cleanup = attachServices(relay)
				if (cleanup) {
					relay.disposalFunctions.push(cleanup)
				}
			}
			this.on(`relay:${id}`, (...data) => {
				relay.in.next(data)
			})
			relay.out.subscribe(`socket`, (data) => {
				this.emit(...(data as [string, ...O[keyof O]]))
			})
		})

		this.on(`close-relay`, (id: string) => {
			const relay = this.relays.get(id)
			this.off(`relay:${id}`)
			if (relay) {
				relay.dispose()
				this.relays.delete(id)
			}
		})
	}

	public relay(
		attachServices: (socket: SubjectSocket<any, any>) => (() => void) | void,
	): void {
		this.relayServices.push(attachServices)
		const relays = this.relays.values()
		for (const relay of relays) {
			const cleanup = attachServices(relay)
			if (cleanup) {
				relay.disposalFunctions.push(cleanup)
			}
			relay.disposalFunctions.push
		}
	}
}
