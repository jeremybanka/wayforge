import { atom } from "atom.io"
import { getFromStore } from "atom.io/internal"
import { takeSnapshot } from "atom.io/testing"

const countAtom = atom<number>({
	key: `count`,
	default: 0,
})

const snapshot = takeSnapshot()

getFromStore(snapshot.store, countAtom)
snapshot.restore()
