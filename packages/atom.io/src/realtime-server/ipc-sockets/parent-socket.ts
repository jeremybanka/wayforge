import type { Readable, Writable } from "node:stream"

import { Subject } from "atom.io/internal"
import type { Json } from "atom.io/json"
import { parseJson, stringifyJson } from "atom.io/json"
import { SetRTX } from "atom.io/transceivers/set-rtx"

import type { EventBuffer, Events } from "./custom-socket"
import { CustomSocket } from "./custom-socket"

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

export type ParentProcess = {
	pid?: number | undefined
	stdin: Readable
	stdout: Writable
	stderr: Writable
	exit: (code?: number) => void
}

export class ParentSocket<
	I extends Events & {
		[id in string as `relay:${id}`]: [string, ...Json.Serializable[]]
	},
	O extends Events & {
		[id in string as `user:${id}`]: [string, ...Json.Serializable[]]
	} & {
		/* eslint-disable quotes */
		"user-joins": [string]
		"user-leaves": [string]
		/* eslint-enable quotes */
	},
	P extends ParentProcess = ParentProcess,
> extends CustomSocket<I, O> {
	protected incompleteData = ``
	protected unprocessedEvents: string[] = []
	protected relays: Map<string, SubjectSocket<any, any>>
	protected relayServices: ((
		socket: SubjectSocket<any, any>,
	) => (() => void) | void)[]
	public proc: P

	public id = `#####`

	protected log(...args: any[]): void {
		this.proc.stderr.write(
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
		info: (...args: any[]): void => {
			this.log(`i`, ...args)
		},
		warn: (...args: any[]): void => {
			this.log(`w`, ...args)
		},
		error: (...args: any[]): void => {
			this.log(`e`, ...args)
		},
	}

	public constructor(proc: P) {
		super((event, ...args) => {
			const stringifiedEvent = JSON.stringify([event, ...args])
			this.proc.stdout.write(stringifiedEvent + `\x03`)
			return this
		})
		this.proc = proc
		this.proc.stdin.resume()
		this.relays = new Map()
		this.relayServices = []
		// this.logger.info(`🔗`, `uplink`, process.pid)

		this.proc.stdin.on(
			`data`,
			<Event extends keyof I>(buffer: EventBuffer<string, I[Event]>) => {
				const chunk = buffer.toString()
				const pieces = chunk.split(`\x03`)
				const maybeInitialWellFormed = pieces[0]
				pieces[0] = this.incompleteData + maybeInitialWellFormed
				let idx = 0
				for (const piece of pieces) {
					try {
						const jsonPiece = parseJson(piece)
						this.logger.info(`🎰`, `received`, jsonPiece)
						this.handleEvent(...(jsonPiece as [string, ...I[keyof I]]))
					} catch (thrown) {
						if (thrown instanceof Error) {
							this.logger.error(`❗`, thrown.message, thrown.cause, thrown.stack)
						}
						try {
							if (idx === 0) {
								const maybeActualJsonPiece = parseJson(maybeInitialWellFormed)
								this.logger.info(`🎰`, `received`, maybeActualJsonPiece)
								this.handleEvent(
									...(maybeActualJsonPiece as [string, ...I[keyof I]]),
								)
							}
							if (idx === pieces.length - 1) {
								this.incompleteData = piece
							}
						} catch (thrown) {
							if (thrown instanceof Error) {
								this.logger.error(
									`❗`,
									thrown.message,
									thrown.cause,
									thrown.stack,
								)
							}
						}
					}
					++idx
				}
			},
		)

		this.on(`exit`, () => {
			this.logger.info(`🔥`, this.id, `received "exit"`)
			this.proc.exit(0)
		})

		if (this.proc.pid) {
			this.id = this.proc.pid?.toString()
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
				this.emit(...(data as [string, ...I[keyof I]]))
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

		this.proc.stdout.write(`ALIVE`)
	}

	public relay(
		attachServices: (socket: SubjectSocket<any, any>) => (() => void) | void,
	): void {
		this.logger.info(`🔗`, `running relay method`)
		this.relayServices.push(attachServices)
	}
}
