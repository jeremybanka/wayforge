import { atom, atomFamily } from "atom.io"
import { join } from "atom.io"
import type { Json } from "atom.io/json"
import type { SetRTXJson } from "atom.io/transceivers/set-rtx"
import { SetRTX } from "atom.io/transceivers/set-rtx"

import type { Identified } from "~/packages/anvl/src/id"

export const findCardValueState = atomFamily<Identified & Json.Object, string>({
	key: `cardValue`,
	default: () => ({ id: `` }),
})
export const cardValuesIndex = atom<SetRTX<string>, SetRTXJson<string>>({
	key: `cardValuesIndex`,
	mutable: true,
	default: () => new SetRTX<string>(),
	toJson: (set) => set.toJSON(),
	fromJson: (json) => SetRTX.fromJSON(json),
})

export const valuesOfCards = join({
	key: `valuesOfCards`,
	between: [`value`, `card`],
	cardinality: `1:n`,
	isAType: (input): input is string => typeof input === `string`,
	isBType: (input): input is string => typeof input === `string`,
})
