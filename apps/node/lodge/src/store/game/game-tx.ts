import { nanoid } from "nanoid"

import { getState, transaction } from "~/packages/atom.io/src"

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
	do: (transactors, deckId, cardIds) => {
		if (cardIds.length !== 52) {
			throw new Error(`${cardIds.length} cards were provided. 52 were expected`)
		}
		const { set } = transactors
		const cardGroup: CardGroup = {
			type: `deck`,
			name: `Classic French 52-Card Deck`,
			rotation: 0,
		}
		set(findCardGroupState(deckId), cardGroup)

		let idx = 0
		valuesOfCards.transact(transactors, ({ relations }) => {
			for (const cardId of cardIds) {
				set(findCardState(cardId), { rotation: 0 })
				relations.set({ card: cardId, value: CARD_VALUES[idx].id })
				idx++
			}
		})
		set(cardGroupIndex, (current) => {
			current.add(deckId)
			return current
		})

		set(cardIndex, (current) => {
			current.transaction((next) => {
				for (const cardId of cardIds) {
					next.add(cardId)
				}
				return true
			})
			return current
		})
		set(cardValuesIndex, (current) => {
			current.transaction((next) => {
				for (const { id: cardValueId } of CARD_VALUES) {
					next.add(cardValueId)
				}
				return true
			})
			return current
		})

		groupsOfCards.transact(transactors, ({ relations }) => {
			for (const cardId of cardIds) {
				relations.set({ card: cardId, group: deckId })
			}
		})
	},
})

export const spawnCardTX = transaction<
	(options: {
		valueId: string
		target: { groupId: string } | { playerId: string } | { zoneId: string }
	}) => void
>({
	key: `spawnCard`,
	do: (transactors, { valueId, target }) => {
		const { get, set } = transactors
		const cardId = nanoid()
		if (`groupId` in target) {
			const { groupId } = target
			const cardGroupDoesExist = get(cardGroupIndex).has(groupId)
			if (!cardGroupDoesExist) {
				throw new Error(`Card group does not exist`)
			}
			groupsOfCards.transact(transactors, ({ relations }) => {
				relations.set({ card: cardId, group: groupId })
			})
			set(cardIndex, (current) => current.add(cardId))
		} else if (`playerId` in target) {
			const { playerId } = target
			const playerDoesExist = get(playersIndex).has(playerId)
			if (!playerDoesExist) {
				throw new Error(`Player does not exist`)
			}
			console.error({ playerId, cardId }, `not implemented`)
		} else if (`zoneId` in target) {
			console.error({ target }, `not implemented`)
		} else {
			throw new Error(`Invalid target`)
		}
		valuesOfCards.transact(transactors, ({ relations }) => {
			relations.set({ card: cardId, value: valueId })
		})
	},
})

export const addHandTx = transaction<
	(options: { playerId: string; groupId: string }) => void
>({
	key: `addHand`,
	do: (transactors, { playerId, groupId }) => {
		const { get, set } = transactors
		const cardGroup: CardGroup = {
			type: `hand`,
			name: ``,
			rotation: 0,
		}
		set(cardGroupIndex, (current) => {
			const next = current.add(groupId)
			return next
		})
		set(findCardGroupState(groupId), cardGroup)
		ownersOfGroups.transact(transactors, ({ relations }) => {
			relations.set({ player: playerId, group: groupId })
		})
	},
})

export const shuffleDeckTX = transaction<(options: { deckId: string }) => void>({
	key: `shuffleDeck`,
	do: (transactors, { deckId }) => {
		const { get } = transactors
		const deckDoesExist = get(cardGroupIndex).has(deckId)
		if (!deckDoesExist) {
			throw new Error(`Deck does not exist`)
		}
		const cardIds = get(groupsOfCards.findState.cardKeysOfGroup(deckId))
		const shuffledCardIds = cardIds.sort(() => Math.random() - 0.5)
		groupsOfCards.transact(transactors, ({ relations }) => {
			relations.replaceRelations(deckId, shuffledCardIds, { reckless: true })
		})
	},
})

export const dealCardsTX = transaction<
	(options: { deckId: string; handId: string; count: number }) => {
		cardIds: string[]
	}
>({
	key: `dealCards`,
	do: (transactors, { deckId, handId, count }) => {
		const { get } = transactors
		const cardGroupKeys = get(cardGroupIndex)
		const deckDoesExist = cardGroupKeys.has(deckId)
		if (!deckDoesExist) {
			throw new Error(`Deck "${deckId}" does not exist`)
		}
		const handDoesExist = cardGroupKeys.has(handId)
		if (!handDoesExist) {
			throw new Error(`Hand "${handId}" does not exist`)
		}

		const deckCardIds = get(groupsOfCards.findState.cardKeysOfGroup(deckId))
		if (deckCardIds.length < count) {
			throw new Error(`Not enough cards in deck "${deckId}" to deal ${count}`)
		}
		const cardIds = deckCardIds.slice(-count)

		groupsOfCards.transact(transactors, ({ relations }) => {
			for (const cardId of cardIds) {
				relations.set({ card: cardId, group: handId })
			}
		})

		return { cardIds }
	},
})
