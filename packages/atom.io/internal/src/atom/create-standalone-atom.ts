import type {
	AtomToken,
	MutableAtomOptions,
	MutableAtomToken,
	RegularAtomOptions,
	RegularAtomToken,
} from "atom.io"
import type { Json } from "atom.io/json"

import type { Transceiver } from "../mutable"
import { createMutableAtom } from "../mutable"
import type { Store } from "../store"
import { createRegularAtom } from "./create-regular-atom"

export function createStandaloneAtom<T>(
	store: Store,
	options: RegularAtomOptions<T>,
): RegularAtomToken<T>

export function createStandaloneAtom<
	T extends Transceiver<any>,
	J extends Json.Serializable,
>(store: Store, options: MutableAtomOptions<T, J>): MutableAtomToken<T, J>

export function createStandaloneAtom<T>(
	store: Store,
	options: MutableAtomOptions<any, any> | RegularAtomOptions<T>,
): AtomToken<T> {
	const isMutable = `mutable` in options

	if (isMutable) {
		const state = createMutableAtom(store, options, undefined)
		store.on.atomCreation.next(state)
		return state
	}
	const state = createRegularAtom(store, options, undefined)
	store.on.atomCreation.next(state)
	return state
}
