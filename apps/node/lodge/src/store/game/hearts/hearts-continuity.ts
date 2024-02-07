import { continuity, usersInThisRoomIndex } from "atom.io/realtime"
import { spawnTrickTX } from "../card-game-actions"
import {
	cardAtoms,
	cardIndex,
	cardValueAtoms,
	cardValueIndex,
	cardValueView,
	cardView,
	deckAtoms,
	deckIndex,
	deckView,
	gamePlayerIndex,
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
	trickIndex,
	trickStates,
	trickView,
	valuesOfCards,
	valuesOfCardsView,
} from "../card-game-stores"
import { startGameTX } from "./hearts-actions"

export const heartsContinuity = continuity({
	key: `hearts`,
	config: (group) => {
		return group
			.add(startGameTX, spawnTrickTX)
			.add(
				cardIndex,
				cardValueIndex,
				deckIndex,
				handIndex,
				pileIndex,
				trickIndex,
				gamePlayerIndex,
				usersInThisRoomIndex,
			)
			.add(cardAtoms, cardView)
			.add(cardValueAtoms, cardValueView)
			.add(deckAtoms, deckView)
			.add(handAtoms, handView)
			.add(pileStates, pileView)
			.add(trickStates, trickView)

			.add(valuesOfCards.core.findRelatedKeysState, valuesOfCardsView)
			.add(groupsOfCards.core.findRelatedKeysState, groupsOfCardsView)
			.add(ownersOfGroups.core.findRelatedKeysState, ownersOfGroupsView)
	},
})
