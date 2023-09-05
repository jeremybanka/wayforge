import { nanoid } from "nanoid"

import { transaction } from "~/packages/atom.io/src"

import { TransceiverSet } from "~/packages/anvl/reactivity"
import { playersIndex } from "../rooms"
import { cardIndex, findCardState } from "./card"
import type { CardGroup } from "./card-group"
import {
	cardGroupIndex,
	findCardGroupState,
	groupsOfCardsState,
	ownersOfGroupsState,
} from "./card-group"
import { cardValuesIndex, findCardValueState, valuesOfCards } from "./card-value"
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

		set(groupsOfCardsState, (current) =>
			cardIds.reduce(
				(acc, cardId) => acc.set({ groupId: deckId, cardId }),
				current,
			),
		)
		set(cardIndex, (current) => new TransceiverSet([...current, ...cardIds]))
		for (const { id: cardValueId } of CARD_VALUES) {
			set(cardValuesIndex, (current) => current.add(cardValueId))
		}
		set(cardGroupIndex, (current) => new TransceiverSet([...current, deckId]))
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
			set(groupsOfCardsState, (current) => current.set({ groupId, cardId }))
			set(cardIndex, (current) => new TransceiverSet([...current, cardId]))
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
		set(cardGroupIndex, (current) => new TransceiverSet([...current, groupId]))
		set(findCardGroupState(groupId), cardGroup)
		set(ownersOfGroupsState, (current) => current.set({ playerId, groupId }))
	},
})

export const shuffleDeckTX = transaction<(options: { deckId: string }) => void>({
	key: `shuffleDeck`,
	do: ({ get, set }, { deckId }) => {
		const deckDoesExist = get(cardGroupIndex).has(deckId)
		if (!deckDoesExist) {
			throw new Error(`Deck does not exist`)
		}
		const cardIds = get(groupsOfCardsState).getRelatedIds(deckId)
		const shuffledCardIds = cardIds.sort(() => Math.random() - 0.5)
		set(groupsOfCardsState, (current) =>
			shuffledCardIds.reduce(
				(acc, cardId) => acc.set({ groupId: deckId, cardId }),
				current,
			),
		)
	},
})

export const dealCardsTX = transaction<
	(options: { deckId: string; handId: string; count: number }) => {
		cardIds: string[]
	}
>({
	key: `dealCards`,
	do: ({ get, set }, { deckId, handId, count }) => {
		const deckDoesExist = get(cardGroupIndex).has(deckId)
		if (!deckDoesExist) {
			throw new Error(`Deck "${deckId}" does not exist`)
		}
		const handDoesExist = get(cardGroupIndex).has(handId)
		if (!handDoesExist) {
			throw new Error(`Hand "${handId}" does not exist`)
		}
		const deckCardIds = get(groupsOfCardsState).getRelatedIds(deckId)
		if (deckCardIds.length < count) {
			throw new Error(`Not enough cards in deck "${deckId}" to deal ${count}`)
		}
		const cardIds = deckCardIds.slice(-count)
		set(groupsOfCardsState, (current) =>
			cardIds.reduce(
				(acc, cardId) => acc.set({ groupId: handId, cardId }),
				current,
			),
		)
		return { cardIds }
	},
})
