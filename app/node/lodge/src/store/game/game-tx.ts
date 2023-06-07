import { nanoid } from "nanoid"

import { transaction } from "~/packages/atom.io/src"

import { cardIndex, findCardState } from "./card"
import type { CardGroup } from "./card-group"
import {
  cardGroupIndex,
  findCardGroupState,
  groupsOfCardsState,
  ownersOfGroupsState,
} from "./card-group"
import {
  cardValuesIndex,
  findCardValueState,
  valuesOfCardsState,
} from "./card-value"
import { playersIndex } from "../rooms"

const CARD_RANKS = [
  `2`,
  `3`,
  `4`,
  `5`,
  `6`,
  `7`,
  `8`,
  `9`,
  `10`,
  `J`,
  `Q`,
  `K`,
  `A`,
] as const
const CARD_SUITS = [`♠`, `♥`, `♦`, `♣`] as const
const CARD_VALUES = CARD_RANKS.flatMap((value) =>
  CARD_SUITS.map((suit) => ({ value, suit, id: value + suit }))
)

export const add52ClassicCardsTX = transaction<() => void>({
  key: `add52ClassicCards`,
  do: ({ set }) => {
    CARD_VALUES.forEach((cardValue) =>
      set(findCardValueState(cardValue.id), cardValue)
    )
    set(
      cardValuesIndex,
      (current) => new Set([...current, ...CARD_VALUES.map((v) => v.id)])
    )
  },
})

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
    cardIds.forEach((cardId) => {
      set(findCardState(cardId), { rotation: 0 })
    })
    set(valuesOfCardsState, (current) =>
      cardIds.reduce((acc, cardId, idx) => {
        const value = CARD_VALUES[idx]
        return acc.set({ cardId, valueId: value.id })
      }, current)
    )
    set(groupsOfCardsState, (current) =>
      cardIds.reduce(
        (acc, cardId) => acc.set({ groupId: deckId, cardId }),
        current
      )
    )
    set(cardIndex, (current) => new Set([...current, ...cardIds]))
    set(
      cardValuesIndex,
      (current) => new Set([...current, ...CARD_VALUES.map((v) => v.id)])
    )
    set(cardGroupIndex, (current) => new Set([...current, deckId]))
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
      set(cardIndex, (current) => new Set([...current, cardId]))
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
    set(valuesOfCardsState, (current) => current.set({ cardId, valueId }))
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
    set(cardGroupIndex, (current) => new Set([...current, groupId]))
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
        current
      )
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
      throw new Error(`Card group does not exist`)
    }
    const handDoesExist = get(cardGroupIndex).has(handId)
    if (!handDoesExist) {
      throw new Error(`Hand does not exist`)
    }
    const deckCardIds = get(groupsOfCardsState).getRelatedIds(deckId)
    if (deckCardIds.length < count) {
      throw new Error(`Not enough cards in deck`)
    }
    const cardIds = deckCardIds.slice(0, count)
    set(groupsOfCardsState, (current) =>
      cardIds.reduce(
        (acc, cardId) => acc.set({ groupId: handId, cardId }),
        current
      )
    )
    return { cardIds }
  },
})
