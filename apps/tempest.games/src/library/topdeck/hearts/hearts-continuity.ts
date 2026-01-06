import { getInternalRelations } from "atom.io"
import { continuity } from "atom.io/realtime"

import {
	dealCardsTX,
	shuffleDeckTX,
	spawnClassicDeckTX,
	spawnHandTX,
	spawnTrickTX,
} from "../card-game-actions"
import {
	cardAtoms,
	cardValueAtoms,
	cardValueIndex,
	cardValueView,
	deckAtoms,
	deckIndex,
	deckView,
	groupsOfCards,
	groupsOfCardsView,
	handAtoms,
	handIndex,
	handView,
	ownersOfGroups,
	ownersOfGroupsView,
	pileIndex,
	pileStates,
	pileView,
	trickKeysAtom,
	trickStates,
	trickView,
	valuesOfCards,
	valuesOfCardsView,
} from "../card-game-stores"
import { startGameTX } from "./hearts-actions"

// export const heartsContinuity = continuity({
// 	key: `hearts`,
// 	config: (group) => {
// 		return group
// 			.add(
// 				startGameTX,
// 				spawnTrickTX,
// 				spawnClassicDeckTX,
// 				shuffleDeckTX,
// 				dealCardsTX,
// 				spawnHandTX,
// 				addPlayerToGameTX,
// 			)
// 			.add(
// 				cardIndex,
// 				cardValueIndex,
// 				deckIndex,
// 				handIndex,
// 				pileIndex,
// 				trickKeysAtom,
// 				gamePlayerKeysAtom,
// 				// usersInThisRoomIndex,
// 			)
// 			.add(cardAtoms, cardView)
// 			.add(cardValueAtoms, cardValueView)
// 			.add(deckAtoms, deckView)
// 			.add(handAtoms, handView)
// 			.add(pileStates, pileView)
// 			.add(trickStates, trickView)

// 			.add(getInternalRelations(valuesOfCards), valuesOfCardsView)
// 			.add(getInternalRelations(groupsOfCards), groupsOfCardsView)
// 			.add(getInternalRelations(ownersOfGroups), ownersOfGroupsView)
// 	},
// })
