import type { RegularAtomToken } from "atom.io"
import { atom, atomFamily, join, selector, selectorFamily } from "atom.io"
import type { SetRTXJson } from "atom.io/transceivers/set-rtx"
import { SetRTX } from "atom.io/transceivers/set-rtx"
import { Perspective } from "occlusion"

export const cardOwners = join({
	key: `ownersOfCards`,
	between: [`owner`, `card`],
	cardinality: `1:n`,
	isAType: (input): input is string => typeof input === `string`,
	isBType: (input): input is string => typeof input === `string`,
})

export const findPlayerPerspectiveState = atomFamily<Perspective, string>({
	key: `findPlayerPerspective`,
	default: new Perspective(),
})

export type Card = {
	rotation: number
}
export const cardAtoms = atomFamily<Card, string>({
	key: `card`,
	default: () => ({
		rotation: 0,
	}),
})
export const cardIndex = atom<SetRTX<string>, SetRTXJson<string>>({
	key: `cardIndex`,
	mutable: true,
	default: () => new SetRTX<string>(),
	toJson: (set) => set.toJSON(),
	fromJson: (json) => SetRTX.fromJSON(json),
})

export const globalCardView = selector<RegularAtomToken<Card>[]>({
	key: `globalCardView`,
	get: ({ find, get }) => {
		const cardTokens: RegularAtomToken<Card>[] = []
		const cardIds = get(cardIndex)
		for (const cardId of cardIds) {
			const cardState = find(cardAtoms, cardId)
			cardTokens.push(cardState)
		}

		return cardTokens
	},
})
export const cardView = selectorFamily<RegularAtomToken<Card>[], string>({
	key: `cardView`,
	get:
		() =>
		({ get }) =>
			get(globalCardView),
})

export type CardCycle = {
	name: string
}
export const findCardCycleState = atomFamily<CardCycle, string>({
	key: `cardCycle`,
	default: () => ({
		name: ``,
	}),
})

export const cardCycleGroupsAndZones = join({
	key: `groupsAndZonesOfCardCycles`,
	between: [`cardCycle`, `groupOrZone`],
	cardinality: `1:n`,
	isAType: (input): input is string => typeof input === `string`,
	isBType: (input): input is string => typeof input === `string`,
})
