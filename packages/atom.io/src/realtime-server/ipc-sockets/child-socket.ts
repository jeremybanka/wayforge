import type { ChildProcessWithoutNullStreams } from "node:child_process"

import type { Json } from "atom.io/json"
import { parseJson } from "atom.io/json"

import type { EventBuffer, Events } from "./custom-socket"
import { CustomSocket } from "./custom-socket"

/* eslint-disable no-console */

export class ChildSocket<
	I extends Events,
	O extends Events,
> extends CustomSocket<I, O> {
	protected incompleteData = ``
	protected unprocessedEvents: string[] = []
	protected incompleteLog = ``
	protected unprocessedLogs: string[] = []

	public id = `#####`

	public process: ChildProcessWithoutNullStreams
	public key: string
	public logger: Pick<Console, `error` | `info` | `warn`>

	protected handleLog(arg: Json.Serializable): void {
		if (Array.isArray(arg)) {
			const [level, ...rest] = arg
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
				default:
					return
			}
		}
	}

	public constructor(
		process: ChildProcessWithoutNullStreams,
		key: string,
		logger?: Pick<Console, `error` | `info` | `warn`>,
	) {
		super((event, ...args) => {
			const stringifiedEvent = JSON.stringify([event, ...args]) + `\x03`
			const errorHandler = (err: { code: string }) => {
				if (err.code === `EPIPE`) {
					console.error(`EPIPE error during write`, this.process.stdin)
				}
				this.process.stdin.removeListener(`error`, errorHandler)
			}

			this.process.stdin.once(`error`, errorHandler)
			this.process.stdin.write(stringifiedEvent)

			return this
		})
		this.process = process
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
		this.process.stdout.on(
			`data`,
			<Event extends keyof I>(buffer: EventBuffer<string, I[Event]>) => {
				const chunk = buffer.toString()

				if (chunk === `ALIVE`) {
					// console.log(chunk)
					return
				}
				this.unprocessedEvents.push(...chunk.split(`\x03`))
				// console.log(`🤓`, chunk.length)
				// console.log(`🤓`, this.unprocessedEvents.length)
				// console.log(`🤓`, ...this.unprocessedEvents.map((x) => x.length))
				const newInput = this.unprocessedEvents.shift()
				this.incompleteData += newInput ?? ``
				try {
					if (this.incompleteData.startsWith(`error`)) {
						console.log(`❗`, this.incompleteData)
					}
					let parsedEvent = parseJson(this.incompleteData)
					this.handleEvent(...(parsedEvent as [string, ...I[keyof I]]))
					while (this.unprocessedEvents.length > 0) {
						const event = this.unprocessedEvents.shift()
						if (event) {
							if (this.unprocessedEvents.length === 0) {
								this.incompleteData = event
							}
							parsedEvent = parseJson(event)
							this.handleEvent(...(parsedEvent as [string, ...I[keyof I]]))
						}
					}
					this.incompleteData = ``
				} catch (error) {
					console.warn(`⚠️----------------⚠️`)
					console.warn(this.incompleteData)
					console.warn(`⚠️----------------⚠️`)
					console.error(error)
				}
			},
		)
		this.process.stderr.on(`data`, (buf) => {
			const chunk = buf.toString()
			this.unprocessedLogs.push(...chunk.split(`\x03`))
			// console.log(`🤫`, chunk.length)
			// console.log(`🤫`, this.unprocessedLogs.length)
			// console.log(`🤫`, ...this.unprocessedLogs.map((x) => x.length))
			const newInput = this.unprocessedLogs.shift()
			this.incompleteLog += newInput ?? ``
			try {
				let parsedLog = parseJson(this.incompleteLog)
				// console.log(`🤫`, parsedLog)
				this.handleLog(parsedLog)
				while (this.unprocessedLogs.length > 0) {
					this.incompleteLog = this.unprocessedLogs.shift() ?? ``
					if (this.incompleteLog) {
						parsedLog = parseJson(this.incompleteLog)
						this.handleLog(parsedLog)
					}
				}
			} catch (error) {
				console.error(`❌❌❌`)
				console.error(this.incompleteLog)
				console.error(error)
				console.error(`❌❌❌️`)
			}
		})
		if (process.pid) {
			this.id = process.pid.toString()
		}
	}
}
