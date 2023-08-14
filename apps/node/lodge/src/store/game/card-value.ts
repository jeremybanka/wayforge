import { atom, atomFamily, selector, transaction } from "atom.io"

import type { Identified } from "~/packages/anvl/src/id"
import { Join } from "~/packages/anvl/src/join"
import type { Json } from "~/packages/anvl/src/json"
import { selectJson } from "~/packages/atom.io/src/json"

export const findCardValueState = atomFamily<Identified & Json.Object, string>({
	key: `findCardValue`,
	default: () => ({ id: `` }),
})
export const cardValuesIndex = atom<Set<string>>({
	key: `cardValuesIndex`,
	default: new Set<string>(),
})
export const cardValuesIndexJSON = selector({
	key: `cardValuesIndexJSON`,
	get: ({ get }) => [...get(cardValuesIndex)],
	set: ({ set }, newValue) => set(cardValuesIndex, new Set(newValue)),
})

export const VALUES_OF_CARDS = new Join({
	relationType: `1:n`,
})
	.from(`valueId`)
	.to(`cardId`)
export const valuesOfCardsState = atom({
	key: `valuesOfCards`,
	default: VALUES_OF_CARDS,
})
export const valuesOfCardsStateJSON = selectJson(
	valuesOfCardsState,
	VALUES_OF_CARDS.makeJsonInterface(),
)

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
		set(cardValuesIndex, (current) => new Set([...current, value.id]))
		set(findCardValueState(value.id), value)
		return true
	},
})
