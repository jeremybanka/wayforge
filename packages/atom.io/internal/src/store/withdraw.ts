import type {
	AtomFamilyToken,
	AtomToken,
	MoleculeConstructor,
	MoleculeFamily,
	MoleculeFamilyToken,
	MoleculeToken,
	MutableAtomFamilyToken,
	MutableAtomToken,
	ReadableFamilyToken,
	ReadableToken,
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
	WritableSelectorFamilyToken,
	WritableSelectorToken,
	WritableToken,
} from "atom.io"
import type { Canonical, Json } from "atom.io/json"
import { stringifyJson } from "atom.io/json"

import type {
	Atom,
	AtomFamily,
	Func,
	Molecule,
	MutableAtom,
	MutableAtomFamily,
	ReadableFamily,
	ReadableState,
	ReadonlySelector,
	ReadonlySelectorFamily,
	RegularAtom,
	RegularAtomFamily,
	Selector,
	SelectorFamily,
	Transceiver,
	WritableFamily,
	WritableSelector,
	WritableSelectorFamily,
	WritableState,
} from ".."
import { NotFoundError } from ".."
import type { Timeline } from "../timeline"
import type { Transaction } from "../transaction"
import type { Store } from "./store"

export type Withdrawable =
	| Atom<any>
	| AtomFamily<any, any>
	| Molecule<any>
	| MoleculeFamily<any>
	| MutableAtom<any, any>
	| MutableAtomFamily<any, any, any>
	| ReadableFamily<any, any>
	| ReadableState<any>
	| ReadonlySelector<any>
	| ReadonlySelectorFamily<any, any>
	| RegularAtom<any>
	| RegularAtomFamily<any, any>
	| Selector<any>
	| SelectorFamily<any, any>
	| Timeline<any>
	| Transaction<any>
	| WritableFamily<any, any>
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

export function withdraw<T, K extends Canonical>(
	token: RegularAtomFamilyToken<T, K>,
	store: Store,
): RegularAtomFamily<T, K>
export function withdraw<
	T extends Transceiver<any>,
	J extends Json.Serializable,
	K extends Canonical,
>(
	token: MutableAtomFamilyToken<T, J, K>,
	store: Store,
): MutableAtomFamily<T, J, K>
export function withdraw<T, K extends Canonical>(
	token: AtomFamilyToken<T>,
	store: Store,
): AtomFamily<T, any>
export function withdraw<T, K extends Canonical>(
	token: ReadonlySelectorFamilyToken<T, K>,
	store: Store,
): ReadonlySelectorFamily<T, any>
export function withdraw<T, K extends Canonical>(
	token: WritableSelectorFamilyToken<T, K>,
	store: Store,
): WritableSelectorFamily<T, any>
export function withdraw<T, K extends Canonical>(
	token: SelectorFamilyToken<T, K>,
	store: Store,
): SelectorFamily<T, any>
export function withdraw<T, K extends Canonical>(
	token: ReadableFamilyToken<T, K>,
	store: Store,
): ReadableFamily<T, any>
export function withdraw<T, K extends Canonical>(
	token: WritableFamilyToken<T, K>,
	store: Store,
): WritableFamily<T, any>

export function withdraw<M extends MoleculeConstructor>(
	token: MoleculeToken<M>,
	store: Store,
): Molecule<M>
export function withdraw<M extends MoleculeConstructor>(
	token: MoleculeFamilyToken<M>,
	store: Store,
): MoleculeFamily<M>

export function withdraw<T extends Func>(
	token: TransactionToken<T>,
	store: Store,
): Transaction<T extends Func ? T : never>
export function withdraw<T>(
	token: TimelineToken<T>,
	store: Store,
): Timeline<T extends TimelineManageable ? T : never>
export function withdraw<T>(
	token:
		| MoleculeFamilyToken<any>
		| MoleculeToken<any>
		| RegularAtomFamilyToken<T, any>
		| RegularAtomToken<T>
		| SelectorFamilyToken<T, any>
		| SelectorToken<T>
		| TimelineToken<T>
		| TransactionToken<T extends Func ? T : never>
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
			case `molecule`:
				withdrawn = target.molecules.get(stringifyJson(token.key))
				break
			case `molecule_family`:
				withdrawn = target.moleculeFamilies.get(token.key)
				break
		}
		if (withdrawn) {
			return withdrawn
		}
		target = target.child
	}
	throw new NotFoundError(token, store)
}
