import { atom, atomFamily, selectorFamily } from "atom.io"
import { findRelations, join } from "atom.io/data"
import type { Json } from "atom.io/json"
import type { Actual, Alias, UserKey } from "atom.io/realtime-server"
import type { SetRTXJson } from "atom.io/transceivers/set-rtx"
import { SetRTX } from "atom.io/transceivers/set-rtx"

import type { Identified } from "~/packages/anvl/src/id"

import type { CardKey } from "."
import {
	currentTrickIdState,
	groupsOfCards,
	handIndex,
	isCardKey,
	ownersOfGroups,
	pileIndex,
} from "."

export type CardValueKey<K extends Actual | Alias = Actual | Alias> =
	`cardValue::${K}`
export const isCardValueKey = (k: string): k is CardValueKey =>
	k.startsWith(`cardValue::`)

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

export const visibleCardValueIndices =
	selectorFamily <
	CardValueKey<[], UserKey>({
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

				return cardIds
			},
	})
