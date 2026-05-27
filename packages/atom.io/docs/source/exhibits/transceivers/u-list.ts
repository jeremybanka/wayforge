import { getState, mutableAtom, setState } from "atom.io"
import { UList } from "atom.io/transceivers/u-list"

const selectedTagKeysAtom = mutableAtom<UList<string>>({
	key: `selectedTagKeys`,
	class: UList,
})

setState(selectedTagKeysAtom, (selectedTagKeys) => {
	selectedTagKeys.add(`typescript`)
	selectedTagKeys.add(`atom-io`)
	return selectedTagKeys
})

getState(selectedTagKeysAtom).has(`typescript`) // -> true
