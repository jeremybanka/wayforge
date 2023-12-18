import { atomFamily, transaction } from "atom.io"

import { IMPLICIT, createMutableAtom } from "atom.io/internal"
import type { Identified } from "~/packages/anvl/src/id"
import type { Json } from "~/packages/anvl/src/json"
import type { SetRTXJson } from "~/packages/atom.io/transceivers/set-rtx/src"
import { SetRTX } from "~/packages/atom.io/transceivers/set-rtx/src"
import { AtomicJunction } from "../utils/atomic-junction"

export const findCardValueState = atomFamily<Identified & Json.Object, string>({
	key: `findCardValue`,
	default: () => ({ id: `` }),
})
export const cardValuesIndex = createMutableAtom<
	SetRTX<string>,
	SetRTXJson<string>
>(
	{
		key: `cardValuesIndex::mutable`,
		mutable: true,
		default: () => new SetRTX<string>(),
		toJson: (set) => set.toJSON(),
		fromJson: (json) => SetRTX.fromJSON(json),
	},
	undefined,
	IMPLICIT.STORE,
)

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
