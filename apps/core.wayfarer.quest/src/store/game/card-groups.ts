import { atomFamily, selectorFamily } from "atom.io"
import { join } from "atom.io/data"
import type { SetRTXJson } from "atom.io/transceivers/set-rtx"
import { SetRTX } from "atom.io/transceivers/set-rtx"

export const groupsOfCards = join({
	key: `groupsOfCards`,
	between: [`group`, `card`],
	cardinality: `1:n`,
})

export const ownersOfGroups = join({
	key: `ownersOfGroups`,
	between: [`player`, `group`],
	cardinality: `1:n`,
})

export const trickContributions = join({
	key: `trickContributions`,
	between: [`player`, `card`],
	cardinality: `1:n`,
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
export const deckIndices = atomFamily<
	SetRTX<string>,
	SetRTXJson<string>,
	string
>({
	key: `deckIndex`,
	mutable: true,
	default: () => new SetRTX<string>(),
	toJson: (set) => set.toJSON(),
	fromJson: (json) => SetRTX.fromJSON(json),
})
export const handStates = atomFamily<Hand, string>({
	key: `hand`,
	default: {
		type: `hand`,
		name: ``,
	},
})
export const handIndices = atomFamily<
	SetRTX<string>,
	SetRTXJson<string>,
	string
>({
	key: `handIndex`,
	mutable: true,
	default: () => new SetRTX<string>(),
	toJson: (set) => set.toJSON(),
	fromJson: (json) => SetRTX.fromJSON(json),
})
export const pileStates = atomFamily<Pile, string>({
	key: `pile`,
	default: {
		type: `pile`,
		name: ``,
	},
})
export const pileIndices = atomFamily<
	SetRTX<string>,
	SetRTXJson<string>,
	string
>({
	key: `pileIndex`,
	mutable: true,
	default: () => new SetRTX<string>(),
	toJson: (set) => set.toJSON(),
	fromJson: (json) => SetRTX.fromJSON(json),
})
export const trickStates = atomFamily<Trick, string>({
	key: `trick`,
	default: {
		type: `trick`,
		name: ``,
	},
})
export const trickIndices = atomFamily<
	SetRTX<string>,
	SetRTXJson<string>,
	string
>({
	key: `trickIndex`,
	mutable: true,
	default: () => new SetRTX<string>(),
	toJson: (set) => set.toJSON(),
	fromJson: (json) => SetRTX.fromJSON(json),
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
