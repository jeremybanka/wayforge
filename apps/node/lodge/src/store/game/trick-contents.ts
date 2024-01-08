import { selectorFamily } from "atom.io"

import { playersInRooms } from "../rooms"
import * as CardGroups from "./card-groups"

export type TrickContent = [playerId: string, cardId: string | undefined]
export const trickContentsStates = selectorFamily<
	TrickContent[],
	[gameId: string, trickId: string]
>({
	key: `trickContents`,
	get:
		([gameId, trickId]) =>
		({ get, find }) => {
			const playerIndex = find(playersInRooms.states.playerKeysOfRoom, gameId)
			const playerIdsInGame = get(playerIndex)
			const cardIdsInTrick = get(
				find(CardGroups.groupsOfCards.states.cardKeysOfGroup, trickId),
			)
			const trickContents = playerIdsInGame.map<TrickContent>((playerId) => {
				const cardsThisPlayerHasInTricks = get(
					find(CardGroups.trickContributions.states.cardKeysOfPlayer, playerId),
				)
				const cardId = cardsThisPlayerHasInTricks.find((cardId) =>
					cardIdsInTrick.includes(cardId),
				)
				return [playerId, cardId]
			})
			return trickContents
		},
})
