import type {
	AtomFamilyToken,
	AtomIOToken,
	AtomToken,
	MutableAtomFamilyToken,
	MutableAtomToken,
	ReadableFamilyToken,
	ReadableToken,
	ReadonlyTransientSelectorFamilyToken,
	ReadonlyTransientSelectorToken,
	RegularAtomFamilyToken,
	RegularAtomToken,
	SelectorFamilyToken,
	SelectorToken,
	TimelineManageable,
	TimelineToken,
	TransactionToken,
	WritableFamilyToken,
	WritableToken,
	WritableTransientSelectorFamilyToken,
	WritableTransientSelectorToken,
} from "atom.io"
import type { Canonical, Json } from "atom.io/json"

import type {
	Atom,
	AtomFamily,
	AtomIOInternalResource,
	Func,
	MutableAtom,
	MutableAtomFamily,
	ReadableFamily,
	ReadableState,
	ReadonlyTransientSelector,
	ReadonlyTransientSelectorFamily,
	RegularAtom,
	RegularAtomFamily,
	Selector,
	SelectorFamily,
	Transceiver,
	WritableFamily,
	WritableState,
	WritableTransientSelector,
	WritableTransientSelectorFamily,
} from ".."
import { NotFoundError } from ".."
import type { Timeline } from "../timeline"
import type { Transaction } from "../transaction"
import type { Store } from "./store"

export function withdraw<T>(
	store: Store,
	token: RegularAtomToken<T>,
): RegularAtom<T>
export function withdraw<T extends Transceiver<any>>(
	store: Store,
	token: MutableAtomToken<T, any>,
): MutableAtom<T, any>
export function withdraw<T>(store: Store, token: AtomToken<T>): Atom<T>
export function withdraw<T>(
	store: Store,
	token: WritableTransientSelectorToken<T>,
): WritableTransientSelector<T>
export function withdraw<T>(
	store: Store,
	token: ReadonlyTransientSelectorToken<T>,
): ReadonlyTransientSelector<T>
export function withdraw<T>(store: Store, token: SelectorToken<T>): Selector<T>
export function withdraw<T>(
	store: Store,
	token: WritableToken<T>,
): WritableState<T>
export function withdraw<T>(
	store: Store,
	token: ReadableToken<T>,
): ReadableState<T>

export function withdraw<T, K extends Canonical>(
	store: Store,
	token: RegularAtomFamilyToken<T, K>,
): RegularAtomFamily<T, K>
export function withdraw<
	T extends Transceiver<any>,
	J extends Json.Serializable,
	K extends Canonical,
>(
	store: Store,
	token: MutableAtomFamilyToken<T, J, K>,
): MutableAtomFamily<T, J, K>
export function withdraw<T, K extends Canonical>(
	store: Store,
	token: AtomFamilyToken<T>,
): AtomFamily<T, any>
export function withdraw<T, K extends Canonical>(
	store: Store,
	token: ReadonlyTransientSelectorFamilyToken<T, K>,
): ReadonlyTransientSelectorFamily<T, any>
export function withdraw<T, K extends Canonical>(
	store: Store,
	token: WritableTransientSelectorFamilyToken<T, K>,
): WritableTransientSelectorFamily<T, any>
export function withdraw<T, K extends Canonical>(
	store: Store,
	token: SelectorFamilyToken<T, K>,
): SelectorFamily<T, any>
export function withdraw<T, K extends Canonical>(
	store: Store,
	token: ReadableFamilyToken<T, K>,
): ReadableFamily<T, any>
export function withdraw<T, K extends Canonical>(
	store: Store,
	token: WritableFamilyToken<T, K>,
): WritableFamily<T, any>

export function withdraw<T extends Func>(
	store: Store,
	token: TransactionToken<T>,
): Transaction<T extends Func ? T : never>
export function withdraw<T>(
	store: Store,
	token: TimelineToken<T>,
): Timeline<T extends TimelineManageable ? T : never>

export function withdraw<T>(
	store: Store,
	token: WritableToken<T>,
): WritableState<T>
export function withdraw<T>(
	store: Store,
	token: ReadableToken<T>,
): ReadableState<T>

export function withdraw(
	store: Store,
	token: AtomIOToken,
): AtomIOInternalResource

export function withdraw(
	store: Store,
	token: AtomIOToken,
): AtomIOInternalResource {
	let withdrawn: AtomIOInternalResource | undefined
	let target: Store | null = store
	while (target !== null) {
		switch (token.type) {
			case `atom`:
			case `mutable_atom`:
				withdrawn = target.atoms.get(token.key)
				break
			case `writable_transient_selector`:
			case `writable_recyclable_selector`:
				withdrawn = target.writableSelectors.get(token.key)
				break
			case `readonly_transient_selector`:
			case `readonly_recyclable_selector`:
				withdrawn = target.readonlySelectors.get(token.key)
				break
			case `atom_family`:
			case `mutable_atom_family`:
			case `writable_transient_selector_family`:
			case `readonly_transient_selector_family`:
			case `writable_recyclable_selector_family`:
			case `readonly_recyclable_selector_family`:
				withdrawn = target.families.get(token.key)
				break
			case `timeline`:
				withdrawn = target.timelines.get(token.key)
				break
			case `transaction`:
				withdrawn = target.transactions.get(token.key)
				break
		}
		if (withdrawn) {
			return withdrawn
		}
		target = target.child
	}
	throw new NotFoundError(token, store)
}
