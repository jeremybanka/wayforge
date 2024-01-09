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
	options: RegularAtomOptions<T>,
	store: Store,
): RegularAtomToken<T>
export function createStandaloneAtom<
	T extends Transceiver<any>,
	J extends Json.Serializable,
>(options: MutableAtomOptions<T, J>, store: Store): MutableAtomToken<T, J>
export function createStandaloneAtom<T>(
	options: MutableAtomOptions<any, any> | RegularAtomOptions<T>,
	store: Store,
): AtomToken<T> {
	const isMutable = `mutable` in options

	if (isMutable) {
		return createMutableAtom(options, undefined, store)
	}
	return createRegularAtom(options, undefined, store)
}
