import { atomFamily, transaction } from "atom.io"
import { join } from "atom.io/data"
import { IMPLICIT, createMutableAtom } from "atom.io/internal"
import type { Json } from "atom.io/json"
import { SetRTX } from "atom.io/transceivers/set-rtx"
import type { SetRTXJson } from "atom.io/transceivers/set-rtx"

import type { Identified } from "~/packages/anvl/src/id"

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

export const valuesOfCards = join({
	key: `valuesOfCards`,
	between: [`value`, `card`],
	cardinality: `1:n`,
})

export const addCardValueTX = transaction<
	<IJ extends Identified & Json.Object>(value: IJ) => boolean
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
