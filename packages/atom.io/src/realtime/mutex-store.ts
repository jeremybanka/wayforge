import type { AtomFamilyToken } from "atom.io"
import { atomFamily } from "atom.io"
import type { Canonical } from "atom.io/json"

export const mutexAtoms: AtomFamilyToken<boolean, Canonical> = atomFamily<
	boolean,
	Canonical
>({
	key: `mutex`,
	default: false,
})
