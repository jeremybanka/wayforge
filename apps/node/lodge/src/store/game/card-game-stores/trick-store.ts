import { selectorFamily } from "atom.io"

import { groupsOfCards, trickContributions } from "./card-groups-store"
import { gamePlayerIndex } from "./game-players-store"

export type TrickContent = [playerId: string, cardId: string | undefined]
export const trickContentsStates = selectorFamily<TrickContent[], string>({
	key: `trickContents`,
	get:
		(trickId) =>
		({ get, find }) => {
			const playerIdsInGame = get(gamePlayerIndex)
			const cardIdsInTrick = get(
				find(groupsOfCards.states.cardKeysOfGroup, trickId),
			)
			const trickContents = playerIdsInGame.map<TrickContent>((playerId) => {
				const cardsThisPlayerHasInTricks = get(
					find(trickContributions.states.cardKeysOfPlayer, playerId),
				)
				const cardId = cardsThisPlayerHasInTricks.find((cardId) =>
					cardIdsInTrick.includes(cardId),
				)
				return [playerId, cardId]
			})
			return trickContents
		},
})
