import { atom, atomFamily, selectorFamily } from "atom.io"
import { findRelations, getInternalRelations, join } from "atom.io/data"
import type { Signal } from "atom.io/internal"
import { getUpdateToken } from "atom.io/internal"
import type { Json } from "atom.io/json"
import {
	type Actual,
	type Alias,
	perspectiveAliases,
	type PerspectiveKey,
} from "atom.io/realtime"
import type { UserKey } from "atom.io/realtime-server"
import type { SetRTXJson } from "atom.io/transceivers/set-rtx"
import { SetRTX } from "atom.io/transceivers/set-rtx"

import type { Identified } from "~/packages/anvl/src/id"

import {
	groupsOfCards,
	handIndex,
	ownersOfGroups,
	pileIndex,
} from "./card-groups-store"
import { type CardKey, isCardKey } from "./cards-store"
import { currentTrickIdState } from "./trick-store"

export type CardValueKey<K extends Actual | Alias = Actual | Alias> =
	`cardValue::${K}`
export const isCardValueKey = (k: string): k is CardValueKey =>
	k.startsWith(`cardValue::`)
export const isActualCardValueKey = (k: string): k is CardValueKey<Actual> =>
	k.startsWith(`cardValue::__`)
export const isAliasCardValueKey = (k: string): k is CardValueKey<Alias> =>
	k.startsWith(`cardValue::$$`)

export const cardValueAtoms = atomFamily<Identified & Json.Object, CardValueKey>(
	{
		key: `cardValue`,
		default: () => ({ id: `` }),
	},
)
export const cardValueIndex = atom<
	SetRTX<CardValueKey>,
	SetRTXJson<CardValueKey>
>({
	key: `cardValuesIndex`,
	mutable: true,
	default: () => new SetRTX<CardValueKey>(),
	toJson: (set) => set.toJSON(),
	fromJson: (json) => SetRTX.fromJSON(json),
})

export const valuesOfCards = join({
	key: `valuesOfCards`,
	between: [`value`, `card`],
	cardinality: `1:n`,
	isAType: isCardValueKey,
	isBType: isCardKey,
})

export const valuesOfCardsJsonMask = selectorFamily<
	SetRTXJson<CardValueKey>,
	CardKey
>({
	key: `valuesOfCardsJsonMask`,
	get:
		(cardKey) =>
		({ get, find, json }) => {
			const cardValueJsonSelector = json(
				find(getInternalRelations(valuesOfCards), cardKey),
			)
			const cardValueJson = get(
				cardValueJsonSelector,
			) as SetRTXJson<CardValueKey>
			return {
				...cardValueJson,
				members: cardValueJson.members, // 👀 IMPLEMENT ALIASING
			}
		},
	set: () => () => {},
})

export const valuesOfCardsUpdateMask = selectorFamily<
	Signal<SetRTX<CardValueKey>>,
	CardKey
>({
	key: `valuesOfCardsUpdateMask`,
	get:
		(cardKey) =>
		({ get, find }) => {
			const updateAtom = getUpdateToken(
				find(getInternalRelations(valuesOfCards), cardKey),
			)
			const update = get(updateAtom)
			return update // 👀 IMPLEMENT ALIASING
		},
	set: () => () => {},
})

export const visibleCardValueIndices = selectorFamily<
	CardKey<Alias>[],
	UserKey<Actual>
>({
	key: `visibleCardIndices`,
	get:
		(username) =>
		({ get }) => {
			const cardIds: CardKey[] = []
			const pileIds = get(pileIndex)
			for (const pileId of pileIds) {
				const pileCardIndex = findRelations(
					groupsOfCards,
					pileId,
				).cardKeysOfGroup
				const pileCardIds = get(pileCardIndex)
				for (const pileCardId of pileCardIds) {
					cardIds.push(pileCardId)
				}
			}

			const currentTrickId = get(currentTrickIdState)
			if (currentTrickId) {
				const trickCardIndex = findRelations(
					groupsOfCards,
					currentTrickId,
				).cardKeysOfGroup
				const trickCardIds = get(trickCardIndex)
				for (const trickCardId of trickCardIds) {
					cardIds.push(trickCardId)
				}
			}
			const handIds = get(handIndex)
			for (const handId of handIds) {
				const handOwnerIdState = findRelations(
					ownersOfGroups,
					handId,
				).playerKeyOfGroup
				const handOwnerId = get(handOwnerIdState)
				if (handOwnerId === username) {
					const handCardIndex = findRelations(
						groupsOfCards,
						handId,
					).cardKeysOfGroup
					const handCardIds = get(handCardIndex)
					for (const handCardId of handCardIds) {
						cardIds.push(handCardId)
					}
				}
			}
			const cardAliases: CardKey<Alias>[] = []
			for (const cardId of cardIds) {
				const actual = cardId.split(`::`).pop() as Actual
				const perspectiveKey: PerspectiveKey = `T$--perspective==${actual}++${username}`
				const alias = get(
					findRelations(perspectiveAliases, perspectiveKey)
						.aliasKeyOfPerspective,
				)
				if (alias) {
					cardAliases.push(`card::${alias}`)
				}
			}
			return cardAliases
		},
})

// val:_1H -> [card:GX]
// val:_2H -> [card:BH]
// card:GX -> [val:_1H]
// card:BH -> [val:_2H]
