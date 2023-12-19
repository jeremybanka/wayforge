import type {
	AtomOptions,
	AtomToken,
	FamilyMetadata,
	MutableAtomOptions,
} from "atom.io"

import { createMutableAtom } from "../mutable"
import type { Store } from "../store"
import { createRegularAtom } from "./create-regular-atom"

export function createAtom<T>(
	options: AtomOptions<T> | MutableAtomOptions<any, any>,
	family: FamilyMetadata | undefined,
	store: Store,
): AtomToken<T> {
	if (`mutable` in options) {
		return createMutableAtom(options, family, store)
	}
	return createRegularAtom<T>(options, family, store)
}
