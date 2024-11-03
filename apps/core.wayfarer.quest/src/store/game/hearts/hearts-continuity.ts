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
	cardValueRelationsMask as valuesOfCardsJsonMask,
	deckAtoms,
	deckIndex,
	gamePlayerIndex,
	groupsOfCards,
	groupsOfCardsJsonMask,
	groupsOfCardsUpdateMask,
	groupsOfCardsView,
	handAtoms,
	handIndex,
	ownersAndGroupsIndex,
	ownersOfGroups,
	pileIndex,
	pileStates,
	trickIndex,
	trickStates,
	valuesOfCards,
	valuesOfCardsUpdateMask,
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
			.add(deckIndex, deckAtoms, getInternalRelations(ownersOfGroups))
			.add(handIndex, handAtoms, getInternalRelations(ownersOfGroups))
			.add(pileIndex, pileStates, getInternalRelations(ownersOfGroups))
			.add(trickIndex, trickStates, getInternalRelations(ownersOfGroups))

			.add(gamePlayerIndex, getInternalRelations(ownersOfGroups))

			.add(visibleCardValueIndices, [
				getInternalRelations(valuesOfCards),
				valuesOfCardsJsonMask,
				valuesOfCardsUpdateMask,
			])
			.add(groupsOfCardsView, [
				getInternalRelations(groupsOfCards),
				groupsOfCardsJsonMask,
				groupsOfCardsUpdateMask,
			])
	},
})
