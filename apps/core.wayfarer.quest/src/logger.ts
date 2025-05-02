import log from "npmlog"

import { IMPLICIT } from "~/packages/atom.io/src/internal"
import type { Logger } from "~/packages/atom.io/src/main"
import { AtomIOLogger } from "~/packages/atom.io/src/main"

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
