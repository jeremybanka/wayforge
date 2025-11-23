import type { AtomFamilyToken } from "atom.io"
import { atomFamily } from "atom.io"
import type { Canonical } from "atom.io/json"

export const mutexAtoms: AtomFamilyToken<boolean, Canonical> = atomFamily({
	key: `mutex`,
	default: false,
})
