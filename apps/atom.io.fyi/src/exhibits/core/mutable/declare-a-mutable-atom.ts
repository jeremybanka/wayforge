import { getState, mutableAtom, setState } from "atom.io"
import { UList } from "atom.io/transceivers/u-list"

export const selectedTagKeysAtom = mutableAtom<UList<string>>({
	key: `selectedTagKeys`,
	class: UList,
})

getState(selectedTagKeysAtom).has(`typescript`) // -> false

setState(selectedTagKeysAtom, (selectedTagKeys) =>
	selectedTagKeys.add(`typescript`),
)

getState(selectedTagKeysAtom).has(`typescript`) // -> true
