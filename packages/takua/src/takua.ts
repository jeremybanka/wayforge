import { inspect } from "node:util"

import picocolors from "picocolors"
import type { Colors } from "picocolors/types"

export type LogFn = (prefix: string, message: string, ...data: unknown[]) => void

export interface LoggerInterface
	extends Pick<Console, `error` | `info` | `warn`> {
	info: LogFn
	warn: LogFn
	error: LogFn
}

export type LoggerConfig = {
	colorEnabled: boolean
}

export class Logger implements LoggerInterface {
	public readonly colorEnabled: boolean
	protected readonly color: Colors

	public constructor({ colorEnabled }: LoggerConfig) {
		this.colorEnabled = colorEnabled
		this.color = picocolors.createColors(true)
	}

	protected log(
		level: keyof LoggerInterface,
		prefix: string,
		message: string,
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
	public info(prefix: string, message: string, ...data: unknown[]): void {
		this.log(`info`, prefix, message, ...data)
	}
	public warn(prefix: string, message: string, ...data: unknown[]): void {
		this.log(`warn`, prefix, message, ...data)
	}
	public error(prefix: string, message: string, ...data: unknown[]): void {
		this.log(`error`, prefix, message, ...data)
	}
}

const takua: Logger = new Logger({ colorEnabled: true })
export default takua
