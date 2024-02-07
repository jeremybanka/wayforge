import { generateHeapSnapshot } from "bun"

import * as AtomIO from "atom.io"
import * as RT from "atom.io/realtime"
import * as RTS from "atom.io/realtime-server"

import { IMPLICIT } from "atom.io/internal"

import { heartsContinuity } from "./store/game/hearts"

process.stdout.write(`✨`)
const parentSocket = new RTS.ParentSocket()
const TIMESTAMP = Date.now()
const LOG_FILEPATH = `./log-${TIMESTAMP}.txt`

const LOG_FILE = Bun.file(LOG_FILEPATH)
const writer = LOG_FILE.writer()

const txt = (arg: unknown) =>
	typeof arg === `string` ? arg : JSON.stringify(arg)

const stderrLog = {
	info: (...args) => {
		process.stderr.write(`\n${Date.now()} [INFO] ${args.map(txt).join(` `)}\n`)
	},
	warn: (...args) => {
		process.stderr.write(`\n${Date.now()} [WARN] ${args.map(txt).join(` `)}\n`)
	},
	error: (...args) => {
		process.stderr.write(`\n${Date.now()} [ERROR] ${args.map(txt).join(` `)}\n`)
	},
}

const atomIOSubprocessLogger = new AtomIO.AtomIOLogger(
	`info`,
	(icon, tokenType, tokenKey, message) => {
		const allowedIcons: AtomIO.LoggerIcon[] = [`🛄`, `🕊️`, `🏗️`, `🖥️`]
		const ignoredTokenTypes: AtomIO.TokenDenomination[] = []
		const ignoredTokens = [`actions`, `radialMode`, `windowMousePosition`]
		const ignoredMessageContents: string[] = []
		if (!allowedIcons.includes(icon)) return false
		if (ignoredTokenTypes.includes(tokenType)) return false
		if (ignoredTokens.includes(tokenKey)) return false
		for (const ignoredMessageContent of ignoredMessageContents) {
			if (message.includes(ignoredMessageContent)) return false
		}
		return true
	},
	stderrLog,
)
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
IMPLICIT.STORE.loggers[1] = atomIOFileLogger

parentSocket.relay((socket) => {
	const snapshot = generateHeapSnapshot()
	Bun.write(`heap.json`, JSON.stringify(snapshot, null, 2))
	socket.onAny((...args) => {
		IMPLICIT.STORE.logger.info(`🖥️`, socket.id, ...args)
		IMPLICIT.STORE.logger.info(`🖥️`, socket.id, socket.globalListeners.keys())
		IMPLICIT.STORE.logger.info(`🖥️`, socket.id, socket.listeners.keys())
	})
	const userId = socket.id.split(`:`)[1]
	IMPLICIT.STORE.logger.info(`👤`, `user`, userId, `connected`)
	AtomIO.setState(RT.usersInThisRoomIndex, (set) => set.add(userId))
	socket.on(`leave-room`, () => {
		IMPLICIT.STORE.logger.info(`👤`, `user`, userId, `left`)
		AtomIO.setState(RT.usersInThisRoomIndex, (set) => (set.delete(userId), set))
	})
	RTS.usersOfSockets.relations.set(userId, socket.id)

	// COMPOSE REALTIME SERVICE HOOKS
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
