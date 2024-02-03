import * as AtomIO from "atom.io"
import * as RT from "atom.io/realtime"
import * as RTS from "atom.io/realtime-server"

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
