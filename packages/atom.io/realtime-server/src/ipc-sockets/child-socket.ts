import type { ChildProcessWithoutNullStreams } from "child_process"

import type { Json } from "atom.io/json"
import { parseJson } from "atom.io/json"

import type { EventBuffer, Events } from "./custom-socket"
import { CustomSocket } from "./custom-socket"

export class ChildSocket<
	I extends Events,
	O extends Events & {
		/* eslint-disable quotes */
		"setup-relay": [string]
		/* eslint-enable quotes */
	},
> extends CustomSocket<I, O> {
	protected incompleteData = ``
	protected unprocessedEvents: string[] = []
	protected incompleteLog = ``
	protected unprocessedLogs: string[] = []

	public id = `#####`

	protected handleLog(arg: Json.Serializable): void {
		if (Array.isArray(arg)) {
			const [level, ...rest] = arg
			switch (level) {
				case `i`:
					this.logger.info(this.id, this.key, ...rest)
					break
				case `w`:
					this.logger.warn(this.id, this.key, ...rest)
					break
				case `e`:
					this.logger.error(this.id, this.key, ...rest)
					break
			}
		}
	}

	public constructor(
		public process: ChildProcessWithoutNullStreams,
		public key: string,
		public logger: {
			info: (prefix: string, message: string, ...args: unknown[]) => void
			warn: (prefix: string, message: string, ...args: unknown[]) => void
			error: (prefix: string, message: string, ...args: unknown[]) => void
		} = console,
	) {
		super((event, ...args) => {
			const stringifiedEvent = JSON.stringify([event, ...args]) + `\x03`
			this.process.stdin.write(stringifiedEvent)
			return this
		})
		this.process = process
		this.process.stdout.on(
			`data`,
			<Event extends keyof I>(buffer: EventBuffer<string, I[Event]>) => {
				const chunk = buffer.toString()

				if (chunk === `✨`) {
					// console.log(chunk)
					return
				}
				this.unprocessedEvents.push(...chunk.split(`\x03`))
				const newInput = this.unprocessedEvents.shift()
				this.incompleteData += newInput || ``
				try {
					if (this.incompleteData.startsWith(`error`)) {
						console.log(`❗`, this.incompleteData)
					}
					const parsedEvent = parseJson(this.incompleteData)
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
					console.warn(`⚠️----------------⚠️`)
					console.error(error)
				}
			},
		)
		this.process.stderr.on(`data`, (buf) => {
			const chunk = buf.toString()
			this.unprocessedLogs.push(...chunk.split(`\x03`))
			const newInput = this.unprocessedLogs.shift()
			this.incompleteLog += newInput || ``
			try {
				const parsedLog = parseJson(this.incompleteLog)
				this.handleLog(parsedLog)
				while (this.unprocessedLogs.length > 0) {
					const error = this.unprocessedLogs.shift()
					if (error) {
						if (this.unprocessedLogs.length === 0) {
							this.incompleteLog = error
						}
						const parsedError = parseJson(error)
						this.handleLog(parsedError)
					}
				}
				this.incompleteLog = ``
			} catch (error) {
				console.warn(`⚠️----------------⚠️`)
				console.error(error)
			}
		})
		if (process.pid) {
			this.id = process.pid.toString()
		}
	}
}
