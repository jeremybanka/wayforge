import { getState, mutableAtom, setState } from "atom.io"
import { OList } from "atom.io/transceivers/o-list"

const queueAtom = mutableAtom<OList<string>>({
	key: `queue`,
	class: OList,
})

setState(queueAtom, (queue) => {
	queue.push(`first`)
	queue.push(`second`)
	return queue
})

getState(queueAtom)[0] // -> "first"
