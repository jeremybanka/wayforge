import { IMPLICIT, Subject } from "atom.io/internal"
import { parseJson, stringifyJson } from "atom.io/json"
import type { Json } from "atom.io/json"

import { SetRTX } from "atom.io/transceivers/set-rtx"
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
		[id in string as `user:${id}`]: [string, ...Json.Serializable[]]
	} & {
		/* eslint-disable quotes */
		"user-joins": [string]
		"user-leaves": [string]
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

	public id = `#####`

	protected log(...args: any[]): void {
		this.process.stderr.write(
			stringifyJson(
				args.map((arg) =>
					arg instanceof SetRTX
						? `{ ${arg.toJSON().members.join(` | `)} }`
						: arg,
				),
			) + `\x03`,
		)
	}
	public logger = {
		info: (...args: any[]): void => this.log(`i`, ...args),
		warn: (...args: any[]): void => this.log(`w`, ...args),
		error: (...args: any[]): void => this.log(`e`, ...args),
	}

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
		// this.logger.info(`🔗`, `uplink`, process.pid)

		this.process.stdin.on(
			`data`,
			<Event extends keyof I>(buffer: EventBuffer<string, I[Event]>) => {
				const chunk = buffer.toString()
				this.unprocessedEvents.push(...chunk.split(`\x03`))
				const newInput = this.unprocessedEvents.shift()
				this.incompleteData += newInput || ``

				try {
					const parsedEvent = parseJson(this.incompleteData)
					this.logger.info(`🎰`, `received`, parsedEvent)
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
				} catch (thrown) {
					if (thrown instanceof Error) {
						this.logger.error(`❗`, thrown.message, thrown.cause, thrown.stack)
					}
				}
			},
		)

		this.on(`exit`, () => {
			this.logger.info(`🔥`, this.id, `received "exit"`)
			process.exit(0)
		})
		process.on(`exit`, (code) => {
			this.logger.info(`🔥`, this.id, `exited with code ${code}`)
		})
		process.on(`end`, () => {
			this.logger.info(`🔥`, this.id, `ended`)
			process.exit(0)
		})
		process.on(`SIGTERM`, () => {
			this.logger.error(`🔥`, this.id, `terminated`)
			process.exit(0)
		})
		process.on(`SIGINT`, () => {
			this.logger.error(`🔥`, this.id, `interrupted`)
			process.exit(0)
		})

		if (process.pid) {
			this.id = process.pid?.toString()
		}

		this.on(`user-joins`, (username) => {
			this.logger.info(`👤`, `user`, username, `joined`)
			const relay = new SubjectSocket(`user:${username}`)
			this.relays.set(username, relay)
			this.logger.info(
				`🔗`,
				`attaching services:`,
				`[${[...this.relayServices.keys()].join(`, `)}]`,
			)
			for (const attachServices of this.relayServices) {
				const cleanup = attachServices(relay)
				if (cleanup) {
					relay.disposalFunctions.push(cleanup)
				}
			}
			this.on(`user:${username}`, (...data) => {
				relay.in.next(data)
			})
			relay.out.subscribe(`socket`, (data) => {
				this.emit(...(data as [string, ...O[keyof O]]))
			})
		})

		this.on(`user-leaves`, (username) => {
			const relay = this.relays.get(username)
			this.off(`relay:${username}`)
			if (relay) {
				relay.dispose()
				this.relays.delete(username)
			}
		})

		process.stdout.write(`✨`)
	}

	public relay(
		attachServices: (socket: SubjectSocket<any, any>) => (() => void) | void,
	): void {
		this.logger.info(`🔗`, `running relay method`)
		this.relayServices.push(attachServices)
	}
}
