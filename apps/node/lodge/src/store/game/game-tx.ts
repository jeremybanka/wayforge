import { nanoid } from "nanoid"

import { transaction } from "~/packages/atom.io/src"

import { playersInRooms, playersIndex } from "../rooms"
import * as CardGroups from "./card-groups"
import { cardValuesIndex, valuesOfCards } from "./card-values"
import { cardIndex, findCardState } from "./cards"
import { CARD_VALUES } from "./playing-card-data"

export const spawnClassicDeckTX = transaction<
	(gameId: string, deckId: string, cardIds: string[]) => void
>({
	key: `spawnClassicDeck`,
	do: (transactors, gameId, deckId, cardIds) => {
		if (cardIds.length !== 52) {
			throw new Error(`${cardIds.length} cards were provided. 52 were expected`)
		}
		const { set, find } = transactors
		const state = find(CardGroups.deckStates, deckId)
		set(state, { type: `deck`, name: `Classic 52-Card Deck` })

		const deckIndex = find(CardGroups.deckIndices, gameId)
		set(deckIndex, (current) => {
			current.add(deckId)
			return current
		})

		valuesOfCards.transact(transactors, ({ relations }) => {
			let idx = 0
			for (const cardId of cardIds) {
				set(findCardState(cardId), { rotation: 0 })
				relations.set({ card: cardId, value: CARD_VALUES[idx].id })
				idx++
			}
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

		CardGroups.groupsOfCards.transact(transactors, ({ relations }) => {
			relations.replaceRelations(deckId, cardIds, { reckless: true })
		})
	},
})

export const spawnCardTX = transaction<
	(options: {
		gameId: string
		valueId: string
		target: { groupId: string } | { playerId: string } | { zoneId: string }
	}) => void
>({
	key: `spawnCard`,
	do: (transactors, { valueId, target }) => {
		const { get, set, find } = transactors
		const cardId = nanoid()
		if (`groupId` in target) {
			const { groupId } = target
			const cardGroupIndex = find(CardGroups.indices, groupId)
			const cardGroupDoesExist = get(cardGroupIndex).includes(groupId)
			if (!cardGroupDoesExist) {
				throw new Error(`Card group does not exist`)
			}
			CardGroups.groupsOfCards.transact(transactors, ({ relations }) => {
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

export const addHandTX = transaction<
	(playerId: string, groupId: string) => void
>({
	key: `addHand`,
	do: (transactors, playerId, handId) => {
		const { get, set, find } = transactors
		const gameId = get(find(playersInRooms.findState.roomKeyOfPlayer, playerId))
		if (gameId === null) {
			console.error({ playerId }, `Player is not in a game`)
			return
		}
		set(CardGroups.handStates(handId), {
			type: `hand`,
			name: ``,
		})
		const handIndex = find(CardGroups.handIndices, gameId)
		set(handIndex, (current) => {
			const next = current.add(handId)
			return next
		})
		CardGroups.ownersOfGroups.transact(transactors, ({ relations }) => {
			relations.set({ player: playerId, group: handId })
		})
	},
})

export const shuffleDeckTX = transaction<(options: { deckId: string }) => void>({
	key: `shuffleDeck`,
	do: (transactors, { deckId }) => {
		const { get, find, env } = transactors
		const deckIndex = find(CardGroups.deckIndices, deckId)
		const deckDoesExist = get(deckIndex).has(deckId)
		if (!deckDoesExist) {
			throw new Error(`Deck does not exist`)
		}
		const cardIds = get(
			CardGroups.groupsOfCards.findState.cardKeysOfGroup(deckId),
		)
		const shuffledCardIds = cardIds.sort(() => Math.random() - 0.5)
		CardGroups.groupsOfCards.transact(transactors, ({ relations }) => {
			relations.replaceRelations(deckId, shuffledCardIds)
		})
		if (env().runtime === `node`) {
			console.log(`Shuffled deck "${deckId}"`)
		}
	},
})

export const dealCardsTX = transaction<
	(
		gameId: string,
		deckId: string,
		handId: string,
		count: number,
	) => { cardIds: string[] }
>({
	key: `dealCards`,
	do: (transactors, gameId, deckId, handId, count) => {
		const { get, find } = transactors
		const deckIndex = find(CardGroups.deckIndices, gameId)
		const deckIds = get(deckIndex)
		const deckDoesExist = deckIds.has(deckId)
		if (!deckDoesExist) {
			throw new Error(`Deck "${deckId}" does not exist`)
		}
		const handIndex = find(CardGroups.handIndices, gameId)
		const handIds = get(handIndex)
		const handDoesExist = handIds.has(handId)
		if (!handDoesExist) {
			throw new Error(`Hand "${handId}" does not exist`)
		}

		const deckCardIds = get(
			find(CardGroups.groupsOfCards.findState.cardKeysOfGroup, deckId),
		)
		if (deckCardIds.length < count) {
			throw new Error(`Not enough cards in deck "${deckId}" to deal ${count}`)
		}
		const cardIds = deckCardIds.slice(-count)

		CardGroups.groupsOfCards.transact(transactors, ({ relations }) => {
			for (const cardId of cardIds) {
				relations.set({ card: cardId, group: handId })
			}
		})

		return { cardIds }
	},
})
