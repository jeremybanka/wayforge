import type { AtomOptions, AtomToken, MutableAtomOptions } from "atom.io"

import { createMutableAtom } from "../mutable"
import type { Store } from "../store"
import { createRegularAtom } from "./create-regular-atom"

export function createStandaloneAtom<T>(
	options: AtomOptions<T> | MutableAtomOptions<any, any>,
	store: Store,
): AtomToken<T> {
	const isMutable = `mutable` in options

	if (isMutable) {
		return createMutableAtom(options, undefined, store)
	}
	return createRegularAtom<T>(options, undefined, store)
}
