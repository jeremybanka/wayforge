import type { EntityDenomination, LoggerIcon } from "atom.io"
import {
	AtomIOLogger,
	editRelations,
	findState,
	getInternalRelations,
	setState,
	subscribe,
} from "atom.io"
import { IMPLICIT } from "atom.io/internal"
import type { Json } from "atom.io/json"
import { usersInRooms } from "atom.io/realtime"
import {
	myRoomKeyAtom,
	pullAtom,
	pullMutableAtomFamilyMember,
} from "atom.io/realtime-client"
import * as RTS from "atom.io/realtime-server"

import { gameContinuity, letterAtoms } from "./game-store"

const LOGGING = false

const parentSocket = new RTS.ParentSocket(process)
const ipcLog = {
	info: (...args: Json.Array) => {
		parentSocket.logger.info(...args)
	},
	warn: (...args: Json.Array) => {
		parentSocket.logger.warn(...args)
	},
	error: (...args: Json.Array) => {
		parentSocket.logger.error(...args)
	},
}

const atomIOSubprocessLogger = new AtomIOLogger(
	`warn`,
	(_, tokenType, tokenKey, message) => {
		const _allowedIcons: LoggerIcon[] = [`🛄`]
		const ignoredTokenTypes: EntityDenomination[] = []
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

if (LOGGING) ipcLog.info(`This is just fyi`)
if (LOGGING) ipcLog.warn(`This is a warning`)
if (LOGGING) ipcLog.error(`This is an error`)

setInterval(() => {
	ipcLog.info(`letterAtoms`, letterAtoms)
}, 1000)

const usersInRoomsAtoms = getInternalRelations(usersInRooms)
pullAtom(IMPLICIT.STORE, parentSocket, myRoomKeyAtom)
let unsubPullUsers: (() => void) | undefined
subscribe(myRoomKeyAtom, ({ newValue: myRoomKey }) => {
	unsubPullUsers?.()
	if (!myRoomKey) return
	unsubPullUsers = pullMutableAtomFamilyMember(
		IMPLICIT.STORE,
		parentSocket,
		usersInRoomsAtoms,
		myRoomKey,
	)
})

parentSocket.receiveRelay((socket, userKey) => {
	editRelations(RTS.usersOfSockets, (relations) => {
		relations.set(`user::relay:${socket.id}`, `socket::${socket.id}`)
	})
	const exposeContinuity = RTS.prepareToProvideContinuity({
		socket,
		consumer: userKey,
	})
	exposeContinuity(gameContinuity, userKey)
})
