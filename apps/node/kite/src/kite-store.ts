import type { MutableAtomToken } from "atom.io"
import { atom, atomFamily, transaction } from "atom.io"
import { arbitrary } from "atom.io/internal"

import type { SetRTXJson } from "~/packages/atom.io/transceivers/set-rtx/src"
import { SetRTX } from "~/packages/atom.io/transceivers/set-rtx/src"

export const numberCollectionIndex = atom<SetRTX<string>, SetRTXJson<string>>({
	key: `numberCollectionIndex`,
	mutable: true,
	default: () => new SetRTX(undefined, 5),
	toJson: (value) => value.toJSON(),
	fromJson: (value) => SetRTX.fromJSON(value),
})

export const findNumberCollection = atomFamily<
	SetRTX<number>,
	SetRTXJson<number>,
	string
>({
	key: `numberCollection`,
	mutable: true,
	default: () => new SetRTX<number>(undefined, 5),
	toJson: (value) => value.toJSON(),
	fromJson: (value) => SetRTX.fromJSON(value),
})

export const addNumberCollectionTX = transaction<(id: string) => string>({
	key: `addNumberCollectionTX`,
	do: ({ set }, id = arbitrary()) => {
		set(numberCollectionIndex, (current) => {
			current.add(id)
			return current
		})
		return id
	},
})

export const incrementNumberCollectionTX = transaction<
	(state: MutableAtomToken<SetRTX<number>, SetRTXJson<number>>) => void
>({
	key: `incrementNumberCollectionTX`,
	do: ({ set }, state) => {
		set(state, (current) => {
			current.add(current.size)
			return current
		})
	},
})
