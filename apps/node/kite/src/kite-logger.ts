import log from "npmlog"
import { IMPLICIT } from "~/packages/atom.io/internal/src"
import { AtomIOLogger } from "~/packages/atom.io/src"

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
IMPLICIT.STORE.loggers = [new AtomIOLogger(`info`, () => true, atomLogger)]
