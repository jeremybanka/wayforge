import { atomFamily, join, mutableAtomFamily, selectorFamily } from "atom.io"
import { SetRTX } from "atom.io/transceivers/set-rtx"

export const groupsOfCards = join({
	key: `groupsOfCards`,
	between: [`group`, `card`],
	cardinality: `1:n`,
	isAType: (input): input is string => typeof input === `string`,
	isBType: (input): input is string => typeof input === `string`,
})

export const ownersOfGroups = join({
	key: `ownersOfGroups`,
	between: [`player`, `group`],
	cardinality: `1:n`,
	isAType: (input): input is string => typeof input === `string`,
	isBType: (input): input is string => typeof input === `string`,
})

export const trickContributions = join({
	key: `trickContributions`,
	between: [`player`, `card`],
	cardinality: `1:n`,
	isAType: (input): input is string => typeof input === `string`,
	isBType: (input): input is string => typeof input === `string`,
})

export type CardGroup = {
	type: `deck` | `hand` | `pile` | `trick`
	name: string
}

export type Deck = CardGroup & {
	type: `deck`
}
export type Hand = CardGroup & {
	type: `hand`
}
export type Pile = CardGroup & {
	type: `pile`
}
export type Trick = CardGroup & {
	type: `trick`
}

export const deckStates = atomFamily<Deck, string>({
	key: `deck`,
	default: {
		type: `deck`,
		name: ``,
	},
})
export const deckIndices = mutableAtomFamily({
	key: `deckIndex`,
	class: SetRTX<string>,
})
export const handStates = atomFamily<Hand, string>({
	key: `hand`,
	default: {
		type: `hand`,
		name: ``,
	},
})
export const handIndices = mutableAtomFamily({
	key: `handIndex`,
	class: SetRTX<string>,
})
export const pileStates = atomFamily<Pile, string>({
	key: `pile`,
	default: {
		type: `pile`,
		name: ``,
	},
})
export const pileIndices = mutableAtomFamily({
	key: `pileIndex`,
	class: SetRTX<string>,
})
export const trickStates = atomFamily<Trick, string>({
	key: `trick`,
	default: {
		type: `trick`,
		name: ``,
	},
})
export const trickIndices = mutableAtomFamily({
	key: `trickIndex`,
	class: SetRTX<string>,
})

export const indices = selectorFamily<string[], string>({
	key: `cardGroupIndex`,
	get:
		(roomId) =>
		({ get, find }) => {
			const deckIds = get(find(deckIndices, roomId))
			const handIds = get(find(handIndices, roomId))
			const pileIds = get(find(pileIndices, roomId))
			const trickIds = get(find(trickIndices, roomId))
			return [...deckIds, ...handIds, ...pileIds, ...trickIds]
		},
})
