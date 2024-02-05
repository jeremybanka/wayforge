import * as AtomIO from "atom.io"
import * as RT from "atom.io/realtime"
import * as RTS from "atom.io/realtime-server"

import { IMPLICIT } from "atom.io/internal"
// debugger
// import {
// 	cardAtoms,
// 	cardCycleGroupsAndZones,
// 	cardGroupIndex,
// 	cardIndex,
// 	cardValueAtoms,
// 	cardValueIndex,
// 	dealCardsTX,
// 	deckAtoms,
// 	deckIndex,
// 	gamePlayerIndex,
// 	groupsOfCards,
// 	handAtoms,
// 	handIndex,
// 	ownersOfGroups,
// 	pileIndex,
// 	pileStates,
// 	shuffleDeckTX,
// 	spawnClassicDeckTX,
// 	spawnHandTX,
// 	spawnTrickTX,
// 	trickIndex,
// 	trickStates,
// 	valuesOfCards,
// } from "./store/game"
import { heartsContinuity } from "./store/game/hearts"
// import { startGameTX } from "./store/game/hearts"

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
		const allowedIcons: AtomIO.LoggerIcon[] = [`🛄`]
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
	const userId = socket.id.split(`:`)[1]
	AtomIO.setState(RT.usersInThisRoomIndex, (set) => set.add(userId))
	RTS.usersOfSockets.relations.set(userId, socket.id)

	// COMPOSE REALTIME SERVICE HOOKS
	const syncContinuity = RTS.realtimeContinuitySynchronizer({ socket })
	// const exposeSingle = RTS.realtimeStateProvider({ socket })
	const exposeMutable = RTS.realtimeMutableProvider({ socket })
	// const exposeFamily = RTS.realtimeAtomFamilyProvider({ socket })
	// const exposeMutableFamily = RTS.realtimeMutableFamilyProvider({ socket })
	// const receiveTransaction = RTS.realtimeActionReceiver({ socket })
	// const syncTransaction = RTS.realtimeActionSynchronizer({ socket })

	// CONTINUITY SERVICES
	syncContinuity(heartsContinuity)

	// ROOM SERVICES
	exposeMutable(RT.usersInThisRoomIndex)

	// // GAME SERVICES
	// exposeSingle(gamePlayerIndex)

	// // Indices
	// exposeMutable(cardIndex)
	// exposeMutable(cardValueIndex)
	// exposeMutable(deckIndex)
	// exposeMutable(handIndex)
	// exposeMutable(pileIndex)
	// exposeMutable(trickIndex)

	// // Families
	// exposeFamily(cardAtoms, cardIndex)
	// exposeFamily(deckAtoms, deckIndex)
	// exposeFamily(handAtoms, handIndex)
	// exposeFamily(pileStates, pileIndex)
	// exposeFamily(trickStates, trickIndex)
	// exposeFamily(cardValueAtoms, cardValueIndex)

	// // Relations
	// const groupsOfCardsFamily = groupsOfCards.core.findRelatedKeysState
	// const ownersOfGroupsFamily = ownersOfGroups.core.findRelatedKeysState
	// const valuesOfCardsFamily = valuesOfCards.core.findRelatedKeysState
	// const cardCycleGZFamily = cardCycleGroupsAndZones.core.findRelatedKeysState
	// exposeMutableFamily(groupsOfCardsFamily, cardGroupIndex)
	// exposeMutableFamily(groupsOfCardsFamily, cardIndex)
	// exposeMutableFamily(ownersOfGroupsFamily, cardGroupIndex)
	// exposeMutableFamily(ownersOfGroupsFamily, cardIndex)
	// exposeMutableFamily(valuesOfCardsFamily, cardValueIndex)
	// exposeMutableFamily(valuesOfCardsFamily, cardIndex)
	// exposeMutableFamily(cardCycleGZFamily, cardGroupIndex)
	// exposeMutableFamily(cardCycleGZFamily, cardIndex)

	// // Transactions
	// receiveTransaction(spawnHandTX)
	// receiveTransaction(dealCardsTX)
	// receiveTransaction(shuffleDeckTX)
	// receiveTransaction(spawnClassicDeckTX)
	// receiveTransaction(spawnTrickTX)
	// syncTransaction(startGameTX)
})
