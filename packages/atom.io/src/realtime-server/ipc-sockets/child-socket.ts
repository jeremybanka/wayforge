import type { Readable, Writable } from "node:stream"

import type { Json, stringified } from "atom.io/json"
import { parseJson } from "atom.io/json"

import type { EventBuffer, EventPayload, Events } from "./custom-socket"
import { CustomSocket } from "./custom-socket"

/* eslint-disable no-console */

export type ChildProcess = {
	pid?: number | undefined
	stdin: Writable
	stdout: Readable
	stderr: Readable
}

export type StderrLog = [`i` | `w` | `e`, ...Json.Array]

export class ChildSocket<
	I extends Events,
	O extends Events,
	P extends ChildProcess = ChildProcess,
> extends CustomSocket<I, O> {
	protected incompleteData = ``
	protected unprocessedEvents: string[] = []
	protected incompleteLog = ``
	protected unprocessedLogs: string[] = []

	public id = `#####`

	public proc: P
	public key: string
	public logger: Pick<Console, `error` | `info` | `warn`>

	protected handleLog(log: StderrLog): void {
		if (Array.isArray(log)) {
			const [level, ...rest] = log
			switch (level) {
				case `i`:
					this.logger.info(...rest)
					break
				case `w`:
					this.logger.warn(...rest)
					break
				case `e`:
					this.logger.error(...rest)
					break
			}
		}
	}

	public constructor(
		proc: P,
		key: string,
		logger?: Pick<Console, `error` | `info` | `warn`>,
	) {
		super((event, ...args) => {
			const stringifiedEvent = JSON.stringify([event, ...args]) + `\x03`
			const errorHandler = (err: { code: string }) => {
				if (err.code === `EPIPE`) {
					console.error(`EPIPE error during write`, this.proc.stdin)
				}
				this.proc.stdin.removeListener(`error`, errorHandler)
			}

			this.proc.stdin.once(`error`, errorHandler)
			this.proc.stdin.write(stringifiedEvent)

			return this
		})
		this.proc = proc
		this.key = key
		this.logger = logger ?? {
			info: (...args: unknown[]) => {
				console.info(this.id, this.key, ...args)
			},
			warn: (...args: unknown[]) => {
				console.warn(this.id, this.key, ...args)
			},
			error: (...args: unknown[]) => {
				console.error(this.id, this.key, ...args)
			},
		}
		this.proc.stdout.on(
			`data`,
			<K extends keyof I & string>(buffer: EventBuffer<I, K>) => {
				const chunk = buffer.toString()

				if (chunk === `ALIVE`) {
					this.logger.info(chunk)
					return
				}

				const pieces = chunk.split(`\x03`)
				const initialMaybeWellFormed = pieces[0]
				pieces[0] = this.incompleteData + initialMaybeWellFormed
				let idx = 0
				for (const piece of pieces) {
					if (piece === ``) {
						continue
					}
					try {
						const jsonPiece = parseJson(piece as stringified<EventPayload<I, K>>)
						this.handleEvent(...jsonPiece)
						this.incompleteData = ``
					} catch (thrown0) {
						const error = thrown0 instanceof Error ? thrown0 : undefined
						console.error(
							[
								`❌ Malformed data received from child process`,
								``,
								piece,
								``,
								error?.message,
							].join(`\n❌\t`),
						)
						try {
							if (idx === 0) {
								const maybeActualJsonPiece = parseJson(
									initialMaybeWellFormed as stringified<StderrLog>,
								)
								this.handleLog(maybeActualJsonPiece)
								this.incompleteData = ``
							}
							if (idx === pieces.length - 1) {
								this.incompleteData += piece
							}
						} catch (thrown1) {
							const error = thrown1 instanceof Error ? thrown1 : undefined
							console.error(
								[
									`❌ Malformed data received from child process`,
									``,
									piece,
									``,
									error?.message,
								].join(`\n❌\t`),
							)
						}
					}
					++idx
				}
			},
		)
		this.proc.stderr.on(`data`, (buffer: Buffer) => {
			const chunk = buffer.toString()
			const pieces = chunk.split(`\x03`)
			const initialMaybeWellFormed = pieces[0]
			pieces[0] = this.incompleteData + initialMaybeWellFormed
			let idx = 0
			for (const piece of pieces) {
				try {
					const jsonPiece = parseJson(piece as stringified<StderrLog>)
					this.handleLog(jsonPiece)
				} catch (thrown) {
					console.error(`❌❌❌`)
					console.error(this.incompleteLog)
					console.error(thrown)
					console.error(`❌❌❌️`)
					try {
						if (idx === 0) {
							const maybeActualJsonPiece = parseJson(
								initialMaybeWellFormed as stringified<StderrLog>,
							)
							this.handleLog(maybeActualJsonPiece)
						}
						if (idx === pieces.length - 1) {
							this.incompleteData = piece
						}
					} catch (thrown) {
						console.error(`❌❌❌`)
						console.error(initialMaybeWellFormed)
						console.error(thrown)
						console.error(`❌❌❌️`)
					}
				}
			}
			++idx
		})
		if (proc.pid) {
			this.id = proc.pid.toString()
		}
	}
}
