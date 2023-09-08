import { nanoid } from "nanoid"

import { getState, transaction } from "~/packages/atom.io/src"

import { IMPLICIT } from "~/packages/atom.io/internal/src"
import { playersIndex } from "../rooms"
import { cardIndex, findCardState } from "./card"
import type { CardGroup } from "./card-group"
import {
	cardGroupIndex,
	findCardGroupState,
	groupsOfCards,
	ownersOfGroups,
} from "./card-group"
import { cardValuesIndex, valuesOfCards } from "./card-value"
import { CARD_VALUES } from "./playing-card-data"

export const spawnClassicDeckTX = transaction<
	(deckId: string, cardIds: string[]) => void
>({
	key: `spawnClassicDeck`,
	do: ({ set }, deckId, cardIds) => {
		if (cardIds.length !== 52) {
			throw new Error(`${cardIds.length} cards were provided. 52 were expected`)
		}
		const cardGroup: CardGroup = {
			type: `deck`,
			name: `Classic French 52-Card Deck`,
			rotation: 0,
		}
		set(findCardGroupState(deckId), cardGroup)

		let idx = 0
		for (const cardId of cardIds) {
			set(findCardState(cardId), { rotation: 0 })
			valuesOfCards.set({ cardId, valueId: CARD_VALUES[idx].id })
			idx++
		}
		set(cardGroupIndex, (current) => {
			current.add(deckId)
			console.log({ current })
			return current
		})

		set(cardIndex, (current) => {
			current.startTransaction()
			for (const cardId of cardIds) {
				current.add(cardId)
			}
			current.applyTransaction()
			return current
		})
		set(cardValuesIndex, (current) => {
			current.startTransaction()
			for (const { id: cardValueId } of CARD_VALUES) {
				current.add(cardValueId)
			}
			current.applyTransaction()
			return current
		})

		const cardsInDeckState = groupsOfCards.findRelationsState__INTERNAL(deckId)

		set(cardsInDeckState, (cardsInDeck) => {
			cardsInDeck.startTransaction()
			for (const cardId of cardIds) {
				cardsInDeck.add(cardId)
			}
			cardsInDeck.applyTransaction()
			return cardsInDeck
		})
		for (const cardId of cardIds) {
			const deckOfCardState = groupsOfCards.findRelationsState__INTERNAL(cardId)
			set(deckOfCardState, (current) => current.add(deckId))
		}
	},
})

export const spawnCardTX = transaction<
	(options: {
		valueId: string
		target: { groupId: string } | { playerId: string } | { zoneId: string }
	}) => void
>({
	key: `spawnCard`,
	do: ({ get, set }, { valueId, target }) => {
		const cardId = nanoid()
		if (`groupId` in target) {
			const { groupId } = target
			const cardGroupDoesExist = get(cardGroupIndex).has(groupId)
			if (!cardGroupDoesExist) {
				throw new Error(`Card group does not exist`)
			}
			groupsOfCards.set({ groupId, cardId })
			set(cardIndex, (current) => current.add(cardId))
		} else if (`playerId` in target) {
			const { playerId } = target
			const playerDoesExist = get(playersIndex).has(playerId)
			if (!playerDoesExist) {
				throw new Error(`Player does not exist`)
			}
			console.log({ playerId, cardId }, `not implemented`)
		} else if (`zoneId` in target) {
			console.log({ target }, `not implemented`)
		} else {
			throw new Error(`Invalid target`)
		}
		valuesOfCards.set({ cardId, valueId })
	},
})

export const addHandTx = transaction<
	(options: { playerId: string; groupId: string }) => void
>({
	key: `addHand`,
	do: ({ set }, { playerId, groupId }) => {
		const cardGroup: CardGroup = {
			type: `hand`,
			name: ``,
			rotation: 0,
		}
		set(cardGroupIndex, (current) => current.add(groupId))
		set(findCardGroupState(groupId), cardGroup)
		ownersOfGroups.set({ playerId, groupId })
	},
})

export const shuffleDeckTX = transaction<(options: { deckId: string }) => void>({
	key: `shuffleDeck`,
	do: ({ get, set }, { deckId }) => {
		const deckDoesExist = get(cardGroupIndex).has(deckId)
		if (!deckDoesExist) {
			throw new Error(`Deck does not exist`)
		}
		const cardIds = get(groupsOfCards.findRelatedKeysState(deckId))
		const shuffledCardIds = cardIds.sort(() => Math.random() - 0.5)
		const cardsInDeckState = groupsOfCards.findRelationsState__INTERNAL(deckId)
		set(cardsInDeckState, (current) => {
			current.startTransaction()
			current.clear()
			for (const cardId of shuffledCardIds) {
				current.add(cardId)
			}
			current.applyTransaction()
			return current
		})

		// set(groupsOfCardsState, (current) =>
		// 	shuffledCardIds.reduce(
		// 		(acc, cardId) => acc.set({ groupId: deckId, cardId }),
		// 		current,
		// 	),
		// )
	},
})

export const dealCardsTX = transaction<
	(options: { deckId: string; handId: string; count: number }) => {
		cardIds: string[]
	}
>({
	key: `dealCards`,
	do: ({ get }, { deckId, handId, count }) => {
		const cardGroupKeys = get(cardGroupIndex)
		console.log({ cardGroupKeys })

		const deckDoesExist = cardGroupKeys.has(deckId)

		if (!deckDoesExist) {
			throw new Error(`Deck "${deckId}" does not exist`)
		}
		const handDoesExist = get(cardGroupIndex).has(handId)
		if (!handDoesExist) {
			throw new Error(`Hand "${handId}" does not exist`)
		}
		const deckCardIds = get(groupsOfCards.findRelatedKeysState(deckId))
		if (deckCardIds.length < count) {
			throw new Error(`Not enough cards in deck "${deckId}" to deal ${count}`)
		}
		const cardIds = deckCardIds.slice(-count)
		console.log({ cardIds })
		for (const cardId of cardIds) {
			groupsOfCards.set({ groupId: handId, cardId })
		}
		console.log(getState(groupsOfCards.findRelationsState__INTERNAL(handId)))
		return { cardIds }
	},
})
