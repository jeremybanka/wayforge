import type { Readable, Writable } from "node:stream"

import { Subject } from "atom.io/internal"
import type { Json } from "atom.io/json"
import { parseJson, stringifyJson } from "atom.io/json"
import type { UserKey } from "atom.io/realtime"
import { UList } from "atom.io/transceivers/u-list"

import type { StderrLog } from "./child-socket"
import type { EventBuffer, EventPayload, Events } from "./custom-socket"
import { CustomSocket } from "./custom-socket"

export const PROOF_OF_LIFE_SIGNAL = `ALIVE`

export class SubjectSocket<
	I extends Events,
	O extends Events,
> extends CustomSocket<I, O> {
	public in: Subject<EventPayload<I>>
	public out: Subject<EventPayload<O>>
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
			this.handleEvent(...event)
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
		[id in string as `relay::${id}`]: [string, ...Json.Array[]]
	},
	O extends Events & {
		[id in string as `user::${id}`]: [string, ...Json.Array[]]
	} & {
		/* eslint-disable quotes */
		"user-joins": [key: UserKey]
		"user-leaves": [key: UserKey]
		/* eslint-enable quotes */
	},
	P extends ParentProcess = ParentProcess,
> extends CustomSocket<I, O> {
	protected incompleteData = ``
	protected unprocessedEvents: string[] = []
	protected relays: Map<string, SubjectSocket<any, any>>
	protected initRelay: (
		socket: SubjectSocket<any, any>,
		userKey: UserKey,
	) => (() => void) | void
	public proc: P

	public id = `#####`

	protected log(...args: StderrLog): void {
		this.proc.stderr.write(
			stringifyJson(
				args.map((arg) =>
					arg instanceof UList ? `{ ${arg.toJSON().join(` | `)} }` : arg,
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
		this.initRelay = () => {
			this.logger.info(`🔗`, `nothing to relay`)
		}

		this.proc.stdin.on(
			`data`,
			<K extends string & keyof I>(buffer: EventBuffer<I, K>) => {
				const chunk = buffer.toString()
				const pieces = chunk.split(`\x03`)
				const initialMaybeWellFormed = pieces[0]
				pieces[0] = this.incompleteData + initialMaybeWellFormed
				let idx = 0
				for (const piece of pieces) {
					if (piece === ``) {
						continue
					}
					try {
						const jsonPiece = parseJson(piece)
						this.logger.info(`🎰`, `received`, jsonPiece)
						this.handleEvent(...(jsonPiece as EventPayload<I>))
						this.incompleteData = ``
					} catch (thrown0) {
						if (thrown0 instanceof Error) {
							this.logger.error(
								[
									`received malformed data from parent process:`,
									``,
									piece,
									``,
									thrown0.message,
								].join(`\n❌\t`),
							)
						}
						try {
							if (idx === 0) {
								this.incompleteData = piece
								const maybeActualJsonPiece = parseJson(initialMaybeWellFormed)
								this.logger.info(`🎰`, `received`, maybeActualJsonPiece)
								this.handleEvent(...(maybeActualJsonPiece as EventPayload<I>))
								this.incompleteData = ``
							} else {
								this.incompleteData += piece
							}
						} catch (thrown1) {
							if (thrown1 instanceof Error) {
								this.logger.error(
									[
										`received malformed data from parent process:`,
										``,
										initialMaybeWellFormed,
										``,
										thrown1.message,
									].join(`\n❌\t`),
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

		this.on(`user-joins`, (userKey: UserKey) => {
			this.logger.info(`👤`, userKey, `joined`)
			const relay = new SubjectSocket(userKey)
			this.relays.set(userKey, relay)
			this.logger.info(`🔗`, `attaching services for user`, userKey)
			const cleanupRelay = this.initRelay(relay, userKey)
			if (cleanupRelay) {
				relay.disposalFunctions.push(cleanupRelay)
			}
			this.on(userKey, (...data) => {
				relay.in.next(data)
			})
			relay.out.subscribe(`socket`, (data) => {
				this.emit(...(data as [string, ...I[string & keyof I]]))
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

		this.proc.stdout.write(PROOF_OF_LIFE_SIGNAL)
	}

	public receiveRelay(
		attachServices: (
			socket: SubjectSocket<any, any>,
			userKey: UserKey,
		) => (() => void) | void,
	): void {
		this.logger.info(`🔗`, `running relay method`)
		this.initRelay = attachServices
	}
}
