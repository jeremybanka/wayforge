import { getInternalRelations } from "atom.io/data"
import { continuity, usersInThisRoomIndex } from "atom.io/realtime"

import { addPlayerToGameTX } from "../card-game-actions/add-player-to-game"
import { dealCardsTX } from "../card-game-actions/deal-cards"
import { shuffleDeckTX } from "../card-game-actions/shuffle-deck"
import { spawnClassicDeckTX } from "../card-game-actions/spawn-classic-deck"
import { spawnHandTX } from "../card-game-actions/spawn-hand"
import { spawnTrickTX } from "../card-game-actions/spawn-trick"
import {
	deckAtoms,
	deckIndex,
	groupsOfCards,
	groupsOfCardsJsonMask,
	groupsOfCardsUpdateMask,
	groupsOfCardsView,
	handAtoms,
	handIndex,
	ownersOfGroups,
	pileIndex,
	pileStates,
} from "../card-game-stores/card-groups-store"
import {
	cardValueAtoms,
	cardValueIndex,
	valuesOfCards,
	valuesOfCardsJsonMask,
	valuesOfCardsUpdateMask,
	visibleCardValueIndices,
} from "../card-game-stores/card-values-store"
import { cardAtoms, cardIndex } from "../card-game-stores/cards-store"
import { gamePlayerIndex } from "../card-game-stores/game-players-store"
import { trickIndex, trickStates } from "../card-game-stores/trick-store"
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
