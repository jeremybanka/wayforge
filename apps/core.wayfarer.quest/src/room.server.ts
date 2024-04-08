import { generateHeapSnapshot } from "bun"

import * as AtomIO from "atom.io"
import * as RT from "atom.io/realtime"
import * as RTS from "atom.io/realtime-server"

import { IMPLICIT } from "atom.io/internal"

import { editRelations } from "atom.io/data"
import { heartsContinuity } from "./store/game/hearts"

const parentSocket = new RTS.ParentSocket()
const TIMESTAMP = Date.now()
const LOG_FILEPATH = `./logs/${TIMESTAMP}.txt`

const LOG_FILE = Bun.file(LOG_FILEPATH)
const writer = LOG_FILE.writer()

const ipcLog = {
	info: (...args) => {
		parentSocket.logger.info(...args)
	},
	warn: (...args) => {
		parentSocket.logger.warn(...args)
	},
	error: (...args) => {
		parentSocket.logger.error(...args)
	},
}

const atomIOSubprocessLogger = new AtomIO.AtomIOLogger(
	`info`,
	(_, tokenType, tokenKey, message) => {
		const allowedIcons: AtomIO.LoggerIcon[] = [`🛄`]
		const ignoredTokenTypes: AtomIO.TokenDenomination[] = []
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

function txt(arg: unknown) {
	return typeof arg === `string` ? arg : JSON.stringify(arg)
}
const atomIOFileLogger = new AtomIO.AtomIOLogger(`info`, () => true, {
	error: (...args) => {
		writer.write(`\n${Date.now()} [ERROR] ${args.map(txt).join(` `)}\n`)
	},
	info: (...args) => {
		writer.write(`\n${Date.now()} [INFO] ${args.map(txt).join(` `)}\n`)
	},
	warn: (...args) => {
		writer.write(`\n${Date.now()} [WARN] ${args.map(txt).join(` `)}\n`)
	},
})

IMPLICIT.STORE.loggers[0] = atomIOSubprocessLogger
// IMPLICIT.STORE.loggers[1] = atomIOFileLogger

const logger = IMPLICIT.STORE.logger

parentSocket.relay((socket) => {
	const snapshot = generateHeapSnapshot()
	void Bun.write(`heap.json`, JSON.stringify(snapshot, null, 2))
	const username = socket.id.split(`:`)[1]
	socket.onAny((event, ...args) => {
		parentSocket.logger.info(username, `<< 🛰 `, event, ...args)
	})
	AtomIO.setState(RT.usersInThisRoomIndex, (set) => set.add(username))
	socket.on(`leave-room`, () => {
		AtomIO.setState(
			RT.usersInThisRoomIndex,
			(set) => (set.delete(username), set),
		)
	})
	editRelations(RTS.usersOfSockets, (relations) => {
		relations.set(username, socket.id)
	})

	const syncContinuity = RTS.realtimeContinuitySynchronizer({ socket })
	const exposeMutable = RTS.realtimeMutableProvider({ socket })

	const disposalFunctions = [
		syncContinuity(heartsContinuity),
		exposeMutable(RT.usersInThisRoomIndex),
	]
	return () => {
		for (const dispose of disposalFunctions) dispose()
	}
})
