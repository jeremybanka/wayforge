import { continuity, usersInThisRoomIndex } from "atom.io/realtime"
import {
	cardIndex,
	cardValuesIndex,
	deckIndex,
	deckStates,
	findCardState,
	findCardValueState,
	gamePlayerIndex,
	groupsOfCards,
	handIndex,
	handStates,
	pileIndex,
	pileStates,
	trickIndex,
	trickStates,
	visibleCardGroupIndices,
	visibleCardIndices,
	visibleCardValueIndices,
	visibleDeckIndices,
	visibleHandIndices,
	visiblePileIndices,
	visibleTrickIndices,
} from "../card-game-stores"
import { startGameTX } from "./hearts-actions"

export const heartsContinuity = continuity({
	key: `hearts`,
	config: (group) => {
		return group
			.add(startGameTX)
			.add(
				cardIndex,
				cardValuesIndex,
				deckIndex,
				handIndex,
				pileIndex,
				trickIndex,
				gamePlayerIndex,
				usersInThisRoomIndex,
			)
			.add(findCardState, visibleCardIndices)
			.add(findCardValueState, visibleCardValueIndices)
			.add(deckStates, visibleDeckIndices)
			.add(handStates, visibleHandIndices)
			.add(pileStates, visiblePileIndices)
			.add(trickStates, visibleTrickIndices)

			.add(groupsOfCards.core.findRelatedKeysState, visibleCardGroupIndices)
	},
})
