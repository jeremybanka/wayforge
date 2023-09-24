import { atom, atomFamily, selectorFamily } from "atom.io"
import { createMutableAtom } from "atom.io/internal"
import { selectJson } from "atom.io/json"

import { TransceiverSet } from "atom.io/transceivers/set-io"
import { Join } from "~/packages/anvl/src/join"
import { hasExactProperties } from "~/packages/anvl/src/object"
import { isWithin } from "~/packages/anvl/src/refinement"
import { Perspective } from "~/packages/occlusion/src"

export const OWNERS_OF_CARDS = new Join({
	relationType: `1:n`,
})
	.from(`playerId`)
	.to(`cardId`)
export const ownersOfCardsState = atom({
	key: `ownersOfCards`,
	default: OWNERS_OF_CARDS,
})
export const ownersOfCardsStateJSON = selectJson(
	ownersOfCardsState,
	OWNERS_OF_CARDS.makeJsonInterface(),
)

export const findOwnerOfCardState = selectorFamily<string | null, string>({
	key: `findOwnerOfCard`,
	get: (cardId) => ({ get }) => {
		const owner = get(ownersOfCardsState).getRelatedId(cardId)
		return owner ?? null
	},
})

export const findPlayerPerspectiveState = atomFamily<Perspective, string>({
	key: `findPlayerPerspective`,
	default: new Perspective(),
})

export type Card = {
	rotation: number
}
export const findCardState = atomFamily<Card, string>({
	key: `findCard`,
	default: () => ({
		rotation: 0,
	}),
})
export const cardIndex = createMutableAtom<TransceiverSet<string>, string[]>({
	key: `cardIndex::mutable`,
	mutable: true,
	default: () => new TransceiverSet<string>(),
	toJson: (set) => [...set],
	fromJson: (array) => new TransceiverSet<string>(array),
})

export type CardCycle = {
	name: string
}
export const findCardCycleState = atomFamily<CardCycle, string>({
	key: `findCardCycle`,
	default: () => ({
		name: ``,
	}),
})

export const GROUPS_AND_ZONES_OF_CARD_CYCLES = new Join<{
	type: `group` | `zone`
}>({
	relationType: `1:n`,
})
	.from(`cardCycleId`)
	.to(`groupOrZoneId`)
export const groupsAndZonesOfCardCyclesState = atom({
	key: `groupsAndZonesOfCardCycles`,
	default: GROUPS_AND_ZONES_OF_CARD_CYCLES,
})
export const groupsAndZonesOfCardCyclesStateJSON = selectJson(
	groupsAndZonesOfCardCyclesState,
	GROUPS_AND_ZONES_OF_CARD_CYCLES.makeJsonInterface(
		hasExactProperties({
			type: isWithin([`group`, `zone`] as const),
		}),
	),
)
