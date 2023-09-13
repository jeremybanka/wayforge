import log from "npmlog"
import { setLogLevel, useLogger } from "~/packages/atom.io/src"

export const logger = log

const atomLogger = {
	info: (...args: unknown[]) => {
		console.log(`atom.io`, `ℹ️ `, ...args)
	},
	warn: (...args: unknown[]) => {
		console.log(`atom.io`, `⚠️ `, ...args)
	},
	error: (...args: unknown[]) => {
		console.log(`atom.io`, `💥 `, ...args)
	},
}
useLogger(atomLogger)
setLogLevel(`info`)
