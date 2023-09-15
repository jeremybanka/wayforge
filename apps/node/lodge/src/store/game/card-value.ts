import { atomFamily, transaction } from "atom.io"

import { createMutableAtom } from "atom.io/internal"
import { TransceiverSet } from "~/packages/anvl/reactivity"
import type { Identified } from "~/packages/anvl/src/id"
import type { Json } from "~/packages/anvl/src/json"
import { AtomicJunction } from "../utils/atomic-junction"

export const findCardValueState = atomFamily<Identified & Json.Object, string>({
	key: `findCardValue`,
	default: () => ({ id: `` }),
})
export const cardValuesIndex = createMutableAtom<
	TransceiverSet<string>,
	string[]
>({
	key: `cardValuesIndex::mutable`,
	mutable: true,
	default: () => new TransceiverSet<string>(),
	toJson: (set) => [...set],
	fromJson: (array) => new TransceiverSet<string>(array),
})

export const valuesOfCards = new AtomicJunction({
	key: `valuesOfCards`,
	between: [`valueId`, `cardId`],
	cardinality: `1:n`,
})

export const addCardValueTX = transaction<
	<IJ extends Identified & Json.Serializable>(value: IJ) => boolean
>({
	key: `addCardValue`,
	do: ({ get, set }, value) => {
		const idHasBeenUsed = get(cardValuesIndex).has(value.id)
		if (idHasBeenUsed) {
			console.error(`Card value id has already been used`)
			return false
		}
		set(cardValuesIndex, (current) => current.add(value.id))
		set(findCardValueState(value.id), value)
		return true
	},
})
