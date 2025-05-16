import type {
	AtomFamilyToken,
	AtomIOToken,
	AtomToken,
	HeldSelectorFamilyToken,
	HeldSelectorToken,
	MutableAtomFamilyToken,
	MutableAtomToken,
	PureSelectorFamilyToken,
	PureSelectorToken,
	ReadableFamilyToken,
	ReadableToken,
	ReadonlyHeldSelectorFamilyToken,
	ReadonlyHeldSelectorToken,
	ReadonlyPureSelectorFamilyToken,
	ReadonlyPureSelectorToken,
	ReadonlySelectorFamilyToken,
	ReadonlySelectorToken,
	RegularAtomFamilyToken,
	RegularAtomToken,
	SelectorFamilyToken,
	SelectorToken,
	TimelineManageable,
	TimelineToken,
	TransactionToken,
	WritableFamilyToken,
	WritableHeldSelectorFamilyToken,
	WritableHeldSelectorToken,
	WritablePureSelectorFamilyToken,
	WritablePureSelectorToken,
	WritableSelectorFamilyToken,
	WritableSelectorToken,
	WritableToken,
} from "atom.io"
import type { Canonical, Json } from "atom.io/json"

import type {
	Atom,
	AtomFamily,
	AtomIOInternalResource,
	Func,
	HeldSelector,
	HeldSelectorFamily,
	MutableAtom,
	MutableAtomFamily,
	PureSelector,
	PureSelectorFamily,
	ReadableFamily,
	ReadableState,
	ReadonlyHeldSelector,
	ReadonlyHeldSelectorFamily,
	ReadonlyPureSelector,
	ReadonlyPureSelectorFamily,
	ReadonlySelector,
	ReadonlySelectorFamily,
	RegularAtom,
	RegularAtomFamily,
	Selector,
	SelectorFamily,
	Transceiver,
	WritableFamily,
	WritableHeldSelector,
	WritableHeldSelectorFamily,
	WritablePureSelector,
	WritablePureSelectorFamily,
	WritableSelector,
	WritableSelectorFamily,
	WritableState,
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
	token: WritableHeldSelectorToken<T>,
): WritableHeldSelector<T>
export function withdraw<T>(
	store: Store,
	token: ReadonlyHeldSelectorToken<T>,
): ReadonlyHeldSelector<T>
export function withdraw<T>(
	store: Store,
	token: WritablePureSelectorToken<T>,
): WritablePureSelector<T>
export function withdraw<T>(
	store: Store,
	token: ReadonlyPureSelectorToken<T>,
): ReadonlyPureSelector<T>
export function withdraw<T>(
	store: Store,
	token: ReadonlySelectorToken<T>,
): ReadonlySelector<T>
export function withdraw<T>(
	store: Store,
	token: WritableSelectorToken<T>,
): WritableSelector<T>
export function withdraw<T>(
	store: Store,
	token: HeldSelectorToken<T>,
): HeldSelector<T>
export function withdraw<T>(
	store: Store,
	token: PureSelectorToken<T>,
): PureSelector<T>
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
	token: ReadonlyHeldSelectorFamilyToken<T, K>,
): ReadonlyHeldSelectorFamily<T, any>
export function withdraw<T, K extends Canonical>(
	store: Store,
	token: WritableHeldSelectorFamilyToken<T, K>,
): WritableHeldSelectorFamily<T, any>
export function withdraw<T, K extends Canonical>(
	store: Store,
	token: ReadonlyPureSelectorFamilyToken<T, K>,
): ReadonlyPureSelectorFamily<T, any>
export function withdraw<T, K extends Canonical>(
	store: Store,
	token: WritablePureSelectorFamilyToken<T, K>,
): WritablePureSelectorFamily<T, any>
export function withdraw<T, K extends Canonical>(
	store: Store,
	token: ReadonlySelectorFamilyToken<T, K>,
): ReadonlySelectorFamily<T, any>
export function withdraw<T, K extends Canonical>(
	store: Store,
	token: WritableSelectorFamilyToken<T, K>,
): WritableSelectorFamily<T, any>
export function withdraw<T, K extends Canonical>(
	store: Store,
	token: HeldSelectorFamilyToken<T, K>,
): HeldSelectorFamily<T, any>
export function withdraw<T, K extends Canonical>(
	store: Store,
	token: PureSelectorFamilyToken<T, K>,
): PureSelectorFamily<T, any>
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
			case `writable_pure_selector`:
			case `writable_held_selector`:
				withdrawn = target.writableSelectors.get(token.key)
				break
			case `readonly_pure_selector`:
			case `readonly_held_selector`:
				withdrawn = target.readonlySelectors.get(token.key)
				break
			case `atom_family`:
			case `mutable_atom_family`:
			case `writable_pure_selector_family`:
			case `readonly_pure_selector_family`:
			case `writable_held_selector_family`:
			case `readonly_held_selector_family`:
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
