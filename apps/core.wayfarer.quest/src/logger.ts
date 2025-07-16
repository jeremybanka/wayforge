import type { Logger } from "atom.io"
import { AtomIOLogger } from "atom.io"
import { IMPLICIT } from "atom.io/internal"
import log from "npmlog"

export const logger = log

const atomLogger: Logger = {
	info: (icon, tokenType, tokenKey, ...args: unknown[]) => {
		console.log(`atom.io`, `ℹ️ `, icon, tokenType, `"${tokenKey}"`, ...args)
	},
	warn: (icon, tokenType, tokenKey, ...args: unknown[]) => {
		console.log(`atom.io`, `ℹ️ `, icon, tokenType, `"${tokenKey}"`, ...args)
	},
	error: (icon, tokenType, tokenKey, ...args: unknown[]) => {
		console.log(`atom.io`, `ℹ️ `, icon, tokenType, `"${tokenKey}"`, ...args)
	},
}
IMPLICIT.STORE.loggers = [
	new AtomIOLogger(`info`, (icon) => icon === `🚀`, atomLogger),
]
