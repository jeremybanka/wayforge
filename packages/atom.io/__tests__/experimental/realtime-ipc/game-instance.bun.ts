import { AsyncLocalStorage } from "async_hooks"
import type { LoggerIcon, TokenDenomination } from "atom.io"
import { AtomIOLogger, findState, setState } from "atom.io"
import * as RTS from "atom.io/realtime-server"

import { editRelations } from "atom.io/data"
import { IMPLICIT } from "../../../internal/src/store"
import { gameContinuity, letterAtoms } from "./game-store"

const parentSocket = new RTS.ParentSocket()
const ipcLog = {
	info: (...args) => parentSocket.logger.info(...args),
	warn: (...args) => parentSocket.logger.warn(...args),
	error: (...args) => parentSocket.logger.error(...args),
}

const atomIOSubprocessLogger = new AtomIOLogger(
	`info`,
	(_, tokenType, tokenKey, message) => {
		const allowedIcons: LoggerIcon[] = [`🛄`]
		const ignoredTokenTypes: TokenDenomination[] = []
		const ignoredTokens = [`actions`, `radialMode`, `windowMousePosition`]
		const ignoredMessageContents: string[] = []
		// if (!allowedIcons.includes(icon)) return false
		if (ignoredTokenTypes.includes(tokenType)) return false
		if (ignoredTokens.includes(tokenKey)) return false
		for (const ignoredMessageContent of ignoredMessageContents) {
			if (message.includes(ignoredMessageContent)) return false
		}
		return true
	},
	ipcLog,
)
IMPLICIT.STORE.loggers[0] = atomIOSubprocessLogger

const letter0State = findState(letterAtoms, 0)

setState(letter0State, `A`)

setInterval(() => {
	ipcLog.info(`letterAtoms`, letterAtoms)
}, 1000)

parentSocket.relay((userSocket) => {
	editRelations(RTS.usersOfSockets, (relations) => {
		relations.set(userSocket.id, `relay:${userSocket.id}`)
	})
	const continuitySynchronizer = RTS.realtimeContinuitySynchronizer({
		socket: userSocket,
	})
	continuitySynchronizer(gameContinuity)
})
