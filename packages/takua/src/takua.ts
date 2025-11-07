import { inspect } from "node:util"

import picocolors from "picocolors"
import type { Colors } from "picocolors/types"

export type LogFn = (
	prefix: string,
	message: number | string,
	...data: unknown[]
) => void

export type LogLevel = `error` | `info` | `warn`

export interface Chronicle {
	mark: (text: string) => void
	logMarks: () => void
}
export interface LoggerInterface extends Pick<Console, LogLevel> {
	info: LogFn
	warn: LogFn
	error: LogFn
	makeChronicle: ({ inline }: { inline?: boolean }) => Chronicle
	chronicle: Chronicle | undefined
}

export type LoggerConfig = {
	colorEnabled: boolean
}

export class Logger implements LoggerInterface {
	public chronicle: Chronicle | undefined
	public readonly colorEnabled: boolean
	protected readonly color: Colors

	public constructor({ colorEnabled }: LoggerConfig) {
		this.colorEnabled = colorEnabled
		this.color = picocolors.createColors(colorEnabled)
	}

	protected log(
		level: LogLevel,
		prefix: string,
		message: number | string,
		...data: unknown[]
	): void {
		let lvlColor: keyof Colors
		let preColor: keyof Colors
		let lvl: string
		switch (level) {
			case `info`:
				lvlColor = `bgCyan`
				preColor = `cyan`
				lvl = `info`
				break
			case `warn`:
				lvlColor = `bgYellow`
				preColor = `yellow`
				lvl = `warn`
				break
			case `error`:
				lvlColor = `bgRed`
				preColor = `red`
				lvl = `ERR!`
				break
		}
		let wheatpaste: string
		if (this.colorEnabled) {
			const c0 = this.color[lvlColor]
			const c1 = this.color[preColor]
			wheatpaste = `${c0(lvl)} ${c1(prefix)} ${c1(message)}`
		} else {
			wheatpaste = `${lvl} ${prefix} ${message}`
		}
		let output = ``
		for (const datum of data) {
			let datumString: string
			if (typeof datum === `string`) {
				datumString = datum
			} else {
				datumString = inspect(datum, false, null, this.colorEnabled)
			}
			if (datumString.includes(`\n`)) {
				const lines = datumString.split(`\n`)
				output += `${wheatpaste} ${lines[0]}`
				for (let i = 1; i < lines.length; ++i) {
					output += `\n${wheatpaste} ${lines[i]}`
				}
			} else {
				output += `${wheatpaste} ${datumString}`
			}
		}
		if (output) {
			console.log(output)
		} else {
			console.log(wheatpaste)
		}
	}
	public info(
		prefix: string,
		message: number | string,
		...data: unknown[]
	): void {
		this.log(`info`, prefix, message, ...data)
	}
	public warn(
		prefix: string,
		message: number | string,
		...data: unknown[]
	): void {
		this.log(`warn`, prefix, message, ...data)
	}
	public error(
		prefix: string,
		message: number | string,
		...data: unknown[]
	): void {
		this.log(`error`, prefix, message, ...data)
	}

	public makeChronicle({ inline = false }: { inline?: boolean } = {}): {
		mark: (text: string) => void
		logMarks: () => void
	} {
		const markers: PerformanceMark[] = []
		const logs: [event: string, duration: number][] = []
		const logMark = (event: string, duration: number): void => {
			const dur = duration.toFixed(2)
			const space = 80 - 2 - event.length - dur.length
			this.info(event, `.`.repeat(space), dur)
		}

		const mark = (text: string) => {
			const prev = markers.at(-1)
			const next = performance.mark(text)
			if (prev) {
				const metric = performance.measure(
					`${prev.name} -> ${next.name}`,
					prev.name,
					next.name,
				)
				if (inline) {
					logMark(next.name, metric.duration)
				} else {
					logs.push([next.name, metric.duration])
				}
			}
			markers.push(next)
		}

		const logMarks = () => {
			const overall = performance.measure(
				`overall`,
				markers[0].name,
				markers[markers.length - 1].name,
			)
			if (!inline) {
				for (const [event, duration] of logs) {
					logMark(event, duration)
				}
			}
			logMark(`TOTAL TIME`, overall.duration)
			console.log()
			this.chronicle = undefined
		}
		const chronicle = (this.chronicle = { mark, logMarks })
		return chronicle
	}
}

const takua: Logger = new Logger({ colorEnabled: true })
export default takua
