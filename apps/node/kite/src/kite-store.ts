import { atom, atomFamily, transaction } from "atom.io"

import { TransceiverSet } from "~/packages/anvl/reactivity"

export const numberCollectionIndex = atom<TransceiverSet<string>, string[]>({
	key: `numberCollectionIndex`,
	mutable: true,
	default: () => new TransceiverSet(),
	toJson: (value) => [...value],
	fromJson: (value) => new TransceiverSet(value),
})

export const findNumberCollection = atomFamily({
	key: `numberCollection`,
	mutable: true,
	default: () => new TransceiverSet<number>(),
	toJson: (value) => [...value],
	fromJson: (value) => new TransceiverSet(value),
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

export const incrementNumberCollectionTX = transaction<(id: string) => void>({
	key: `incrementNumberCollectionTX`,
	do: ({ get, set }, id) => {
		const collection = get(findNumberCollection(id))
		set(findNumberCollection(id), (current) => {
			current.add(collection.size + 1)
			return current
		})
	},
})
