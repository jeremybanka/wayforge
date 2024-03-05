import { getInternalRelations } from "atom.io/data"
import { continuity, usersInThisRoomIndex } from "atom.io/realtime"
import {
	dealCardsTX,
	shuffleDeckTX,
	spawnClassicDeckTX,
	spawnHandTX,
	spawnTrickTX,
} from "../card-game-actions"
import { addPlayerToGameTX } from "../card-game-actions/add-player-to-game"
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
			.add(
				startGameTX,
				spawnTrickTX,
				spawnClassicDeckTX,
				shuffleDeckTX,
				dealCardsTX,
				spawnHandTX,
				addPlayerToGameTX,
			)
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

			.add(getInternalRelations(valuesOfCards), valuesOfCardsView)
			.add(getInternalRelations(groupsOfCards), groupsOfCardsView)
			.add(getInternalRelations(ownersOfGroups), ownersOfGroupsView)
	},
})
