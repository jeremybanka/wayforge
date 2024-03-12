import type {
	AtomFamily,
	AtomFamilyToken,
	AtomToken,
	MutableAtomFamily,
	MutableAtomFamilyToken,
	MutableAtomToken,
	ReadableToken,
	ReadonlySelectorFamily,
	ReadonlySelectorFamilyToken,
	ReadonlySelectorToken,
	RegularAtomFamily,
	RegularAtomFamilyToken,
	RegularAtomToken,
	SelectorFamily,
	SelectorFamilyToken,
	SelectorToken,
	TimelineManageable,
	TimelineToken,
	TransactionToken,
	WritableSelectorFamily,
	WritableSelectorFamilyToken,
	WritableSelectorToken,
	WritableToken,
	ƒn,
} from "atom.io"

import type { Json } from "atom.io/json"
import type {
	Atom,
	MutableAtom,
	ReadableState,
	ReadonlySelector,
	RegularAtom,
	Selector,
	Transceiver,
	WritableSelector,
	WritableState,
} from ".."
import { NotFoundError } from ".."

import type { Timeline } from "../timeline"
import type { Transaction } from "../transaction"
import type { Store } from "./store"

export type Withdrawable =
	| Atom<any>
	| AtomFamily<any, any>
	| MutableAtom<any, any>
	| MutableAtomFamily<any, any, any>
	| ReadableState<any>
	 
	| ReadonlySelector<any>
	| ReadonlySelectorFamily<any, any>
	| RegularAtom<any>
	| RegularAtomFamily<any, any>
	| Selector<any>
	| SelectorFamily<any, any>
	| Timeline<any>
	| Transaction<any>
	| WritableSelector<any>
	| WritableSelectorFamily<any, any>
	| WritableState<any>

export function withdraw<T>(
	token: RegularAtomToken<T>,
	store: Store,
): RegularAtom<T>
export function withdraw<T extends Transceiver<any>>(
	token: MutableAtomToken<T, any>,
	store: Store,
): MutableAtom<T, any>
export function withdraw<T>(token: AtomToken<T>, store: Store): Atom<T>
export function withdraw<T>(
	token: WritableSelectorToken<T>,
	store: Store,
): WritableSelector<T>
export function withdraw<T>(
	token: ReadonlySelectorToken<T>,
	store: Store,
): ReadonlySelector<T>
export function withdraw<T>(token: SelectorToken<T>, store: Store): Selector<T>
export function withdraw<T>(
	token: WritableToken<T>,
	store: Store,
): WritableState<T>
export function withdraw<T>(
	token: ReadableToken<T>,
	store: Store,
): ReadableState<T>

export function withdraw<T, K extends Json.Serializable>(
	token: RegularAtomFamilyToken<T, K>,
	store: Store,
): RegularAtomFamily<T, K>
export function withdraw<
	T extends Transceiver<any>,
	J extends Json.Serializable,
	K extends Json.Serializable,
>(
	token: MutableAtomFamilyToken<T, J, K>,
	store: Store,
): MutableAtomFamily<T, J, K>
export function withdraw<T, K extends Json.Serializable>(
	token: AtomFamilyToken<T>,
	store: Store,
): AtomFamily<T, any>
export function withdraw<T, K extends Json.Serializable>(
	token: ReadonlySelectorFamilyToken<T, K>,
	store: Store,
): ReadonlySelectorFamily<T, any>
export function withdraw<T, K extends Json.Serializable>(
	token: WritableSelectorFamilyToken<T, K>,
	store: Store,
): WritableSelectorFamily<T, any>
export function withdraw<T, K extends Json.Serializable>(
	token: SelectorFamilyToken<T, K>,
	store: Store,
): SelectorFamily<T, any>

export function withdraw<T>(
	token: TransactionToken<T>,
	store: Store,
): Transaction<T extends ƒn ? T : never>
export function withdraw<T>(
	token: TimelineToken<T>,
	store: Store,
): Timeline<T extends TimelineManageable ? T : never>
export function withdraw<T>(
	token:
		| RegularAtomFamilyToken<T, any>
		| RegularAtomToken<T>
		| SelectorFamilyToken<T, any>
		| SelectorToken<T>
		| TimelineToken<T>
		| TransactionToken<T>
		| (T extends Transceiver<any>
				? MutableAtomFamilyToken<T, any, any> | MutableAtomToken<T, any>
				: never),
	store: Store,
): Withdrawable {
	let withdrawn: Withdrawable | undefined
	let target: Store | null = store
	while (target !== null) {
		switch (token.type) {
			case `atom`:
			case `mutable_atom`:
				withdrawn = target.atoms.get(token.key)
				break
			case `selector`:
				withdrawn = target.selectors.get(token.key)
				break
			case `readonly_selector`:
				withdrawn = target.readonlySelectors.get(token.key)
				break
			case `atom_family`:
			case `mutable_atom_family`:
			case `selector_family`:
			case `readonly_selector_family`:
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
