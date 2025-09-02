import type { Readable, Writable } from "node:stream"

import { Subject } from "atom.io/internal"
import type { Json } from "atom.io/json"
import { parseJson, stringifyJson } from "atom.io/json"
import { SetRTX } from "atom.io/transceivers/set-rtx"

import type { EventBuffer, EventPayload, Events } from "./custom-socket"
import { CustomSocket } from "./custom-socket"
import { StderrLog } from "./child-socket"

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
			this.handleEvent(...(event as EventPayload<I>))
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

	protected log(...args: StderrLog): void {
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
		info: (...args: Json.Array): void => {
			this.log(`i`, ...args)
		},
		warn: (...args: Json.Array): void => {
			this.log(`w`, ...args)
		},
		error: (...args: Json.Array): void => {
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

		this.proc.stdin.on(
			`data`,
			<K extends string & keyof I>(buffer: EventBuffer<I, K>) => {
				const chunk = buffer.toString()
				const pieces = chunk.split(`\x03`)
				const initialMaybeWellFormed = pieces[0]
				pieces[0] = this.incompleteData + initialMaybeWellFormed
				let idx = 0
				for (const piece of pieces) {
					try {
						const jsonPiece = parseJson(piece)
						this.logger.info(`🎰`, `received`, jsonPiece)
						this.handleEvent(...(jsonPiece as EventPayload<I>))
					} catch (thrown0) {
						if (thrown0 instanceof Error) {
							this.logger.error(`❗`, thrown0.message, thrown0.stack as string)
						}
						try {
							if (idx === 0) {
								const maybeActualJsonPiece = parseJson(initialMaybeWellFormed)
								this.logger.info(`🎰`, `received`, maybeActualJsonPiece)
								this.handleEvent(...(maybeActualJsonPiece as EventPayload<I>))
							}
							if (idx === pieces.length - 1) {
								this.incompleteData = piece
							}
						} catch (thrown1) {
							if (thrown1 instanceof Error) {
								this.logger.error(`❗`, thrown1.message, thrown1.stack as string)
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
