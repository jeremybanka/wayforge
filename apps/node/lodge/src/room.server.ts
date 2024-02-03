import * as AtomIO from "atom.io"
import * as RT from "atom.io/realtime"
import * as RTS from "atom.io/realtime-server"

import {
	cardCycleGroupsAndZones,
	cardGroupIndex,
	cardIndex,
	cardValuesIndex,
	dealCardsTX,
	deckIndex,
	deckStates,
	findCardState,
	findCardValueState,
	gamePlayerIndex,
	groupsOfCards,
	handIndex,
	handStates,
	ownersOfGroups,
	pileIndex,
	pileStates,
	shuffleDeckTX,
	spawnClassicDeckTX,
	spawnHandTX,
	spawnTrickTX,
	trickIndex,
	trickStates,
	valuesOfCards,
} from "./store/game"
import { startGameTX } from "./store/game/hearts"

process.stdout.write(`✨`)
const parentSocket = new RTS.ParentSocket()
const TIMESTAMP = Date.now()

parentSocket.relay((socket) => {
	const userId = socket.id.split(`:`)[1]
	AtomIO.setState(RT.usersInThisRoomIndex, (set) => set.add(userId))
	RTS.usersOfSockets.relations.set(userId, socket.id)

	// COMPOSE REALTIME SERVICE HOOKS
	const exposeSingle = RTS.realtimeStateProvider({ socket })
	const exposeMutable = RTS.realtimeMutableProvider({ socket })
	const exposeFamily = RTS.realtimeAtomFamilyProvider({ socket })
	const exposeMutableFamily = RTS.realtimeMutableFamilyProvider({ socket })
	const receiveTransaction = RTS.realtimeActionReceiver({ socket })
	const syncTransaction = RTS.realtimeActionSynchronizer({ socket })

	// ROOM SERVICES
	exposeMutable(RT.usersInThisRoomIndex)

	// GAME SERVICES
	exposeSingle(gamePlayerIndex)

	// Indices
	exposeMutable(cardIndex)
	exposeMutable(cardValuesIndex)
	exposeMutable(deckIndex)
	exposeMutable(handIndex)
	exposeMutable(pileIndex)
	exposeMutable(trickIndex)

	// Families
	exposeFamily(findCardState, cardIndex)
	exposeFamily(deckStates, deckIndex)
	exposeFamily(handStates, handIndex)
	exposeFamily(pileStates, pileIndex)
	exposeFamily(trickStates, trickIndex)
	exposeFamily(findCardValueState, cardValuesIndex)

	// Relations
	const groupsOfCardsFamily = groupsOfCards.core.findRelatedKeysState
	const ownersOfGroupsFamily = ownersOfGroups.core.findRelatedKeysState
	const valuesOfCardsFamily = valuesOfCards.core.findRelatedKeysState
	const cardCycleGZFamily = cardCycleGroupsAndZones.core.findRelatedKeysState
	exposeMutableFamily(groupsOfCardsFamily, cardGroupIndex)
	exposeMutableFamily(groupsOfCardsFamily, cardIndex)
	exposeMutableFamily(ownersOfGroupsFamily, cardGroupIndex)
	exposeMutableFamily(ownersOfGroupsFamily, cardIndex)
	exposeMutableFamily(valuesOfCardsFamily, cardValuesIndex)
	exposeMutableFamily(valuesOfCardsFamily, cardIndex)
	exposeMutableFamily(cardCycleGZFamily, cardGroupIndex)
	exposeMutableFamily(cardCycleGZFamily, cardIndex)

	// Transactions
	receiveTransaction(spawnHandTX)
	receiveTransaction(dealCardsTX)
	receiveTransaction(shuffleDeckTX)
	receiveTransaction(spawnClassicDeckTX)
	receiveTransaction(spawnTrickTX)
	syncTransaction(startGameTX)
})
