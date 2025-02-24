import type { LogFn, Logger } from "atom.io"

export const nullLog =
	(_logLevel: keyof Logger): LogFn =>
	(_icon, _denomination, _tokenKey, _message, ..._rest) => {}
export const createNullLogger = (): Logger => ({
	error: nullLog(`error`),
	info: nullLog(`info`),
	warn: nullLog(`warn`),
})
