import { atomFamily, join, mutableAtom } from "atom.io"
import type { Json } from "atom.io/json"
import { SetRTX } from "atom.io/transceivers/set-rtx"

import type { Identified } from "../utility-types"

export const findCardValueState = atomFamily<Identified & Json.Object, string>({
	key: `cardValue`,
	default: () => ({ id: `` }),
})
export const cardValuesIndex = mutableAtom<SetRTX<string>>({
	key: `cardValuesIndex`,
	class: SetRTX,
})

export const valuesOfCards = join({
	key: `valuesOfCards`,
	between: [`value`, `card`],
	cardinality: `1:n`,
	isAType: (input): input is string => typeof input === `string`,
	isBType: (input): input is string => typeof input === `string`,
})
