import type { MutableAtomToken } from "atom.io"
import { atom, atomFamily, transaction } from "atom.io"

import { TransceiverSet } from "atom.io/transceivers/set-io"
import type { TransceiverSetJSON } from "atom.io/transceivers/set-io"

export const numberCollectionIndex = atom<
	TransceiverSet<string>,
	TransceiverSetJSON<string>
>({
	key: `numberCollectionIndex`,
	mutable: true,
	default: () => new TransceiverSet(null, 5),
	toJson: (value) => value.toJSON(),
	fromJson: (value) => TransceiverSet.fromJSON(value),
})

export const findNumberCollection = atomFamily({
	key: `numberCollection`,
	mutable: true,
	default: () => new TransceiverSet<number>(null, 5),
	toJson: (value) => value.toJSON(),
	fromJson: (value) => TransceiverSet.fromJSON(value),
})

export const addNumberCollectionTX = transaction<(id: string) => string>({
	key: `addNumberCollectionTX`,
	do: ({ set }, id = Math.random().toString(36).slice(2)) => {
		set(numberCollectionIndex, (current) => {
			current.add(id)
			return current
		})
		return id
	},
})

export const incrementNumberCollectionTX = transaction<
	(
		state: MutableAtomToken<TransceiverSet<number>, TransceiverSetJSON<number>>,
	) => void
>({
	key: `incrementNumberCollectionTX`,
	do: ({ set }, state) => {
		set(state, (current) => {
			current.add(current.size)
			return current
		})
	},
})
