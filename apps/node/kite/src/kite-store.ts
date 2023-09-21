import { MutableAtomToken, atom, atomFamily, transaction } from "atom.io"

import { TransceiverSet } from "~/packages/anvl/reactivity"

export const numberCollectionIndex = atom<TransceiverSet<string>, string[]>({
	key: `numberCollectionIndex`,
	mutable: true,
	default: () => new TransceiverSet(null, 50),
	toJson: (value) => [...value],
	fromJson: (value) => new TransceiverSet(value, 50),
})

export const findNumberCollection = atomFamily({
	key: `numberCollection`,
	mutable: true,
	default: () => new TransceiverSet<number>(null, 20),
	toJson: (value) => [...value],
	fromJson: (value) => new TransceiverSet(value, 20),
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
	(state: MutableAtomToken<TransceiverSet<number>, number[]>) => void
>({
	key: `incrementNumberCollectionTX`,
	do: ({ set }, state) => {
		set(state, (current) => {
			current.add(current.size)
			return current
		})
	},
})
