import type { ChildProcessWithoutNullStreams } from "child_process"

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
	protected process: ChildProcessWithoutNullStreams
	protected incompleteData = ``
	protected unprocessedEvents: string[] = []

	public id = `no_id_retrieved`

	public constructor(process: ChildProcessWithoutNullStreams) {
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
				this.unprocessedEvents.push(...chunk.split(`\x03`))
				const newInput = this.unprocessedEvents.shift()
				this.incompleteData += newInput || ``
				try {
					console.log(
						`🤓`,
						newInput?.length,
						`/`,
						this.incompleteData.length,
						newInput,
					)
					const parsedEvent = parseJson(this.incompleteData)
					console.log(`🤓`, `parsed!`)
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
		if (process.pid) {
			this.id = process.pid.toString()
		}
	}
}
