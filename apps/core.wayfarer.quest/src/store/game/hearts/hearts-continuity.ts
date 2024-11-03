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
	deckAtoms,
	deckIndex,
	gamePlayerIndex,
	groupsOfCards,
	handAtoms,
	handIndex,
	ownersOfGroups,
	pileIndex,
	pileStates,
	trickIndex,
	trickStates,
	valuesOfCards,
	visibleCardValueIndices,
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
			.add(cardIndex, cardAtoms)
			.add(cardValueIndex, cardValueAtoms)
			.add(deckIndex, deckAtoms)
			.add(handIndex, handAtoms)
			.add(pileIndex, pileStates)
			.add(trickIndex, trickStates)

			.add(visibleCardValueIndices, [getInternalRelations(valuesOfCards)])
			.add(groupsOfCardsView, getInternalRelations(groupsOfCards))
			.add(ownersOfGroupsView, getInternalRelations(ownersOfGroups))
	},
})
