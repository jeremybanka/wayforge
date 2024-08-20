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
	TransactionToken,
	WritableFamilyToken,
	WritableSelectorFamilyToken,
	WritableSelectorToken,
	WritableToken,
} from "atom.io"
import type { Canonical, Json } from "atom.io/json"

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
import type { Transaction } from "../transaction"

export function deposit<T>(state: RegularAtom<T>): RegularAtomToken<T>
export function deposit<T extends Transceiver<any>>(
	state: MutableAtom<T, any>,
): MutableAtomToken<T, any>
export function deposit<T>(state: Atom<T>): AtomToken<T>
export function deposit<T>(state: WritableSelector<T>): WritableSelectorToken<T>
export function deposit<T>(state: ReadonlySelector<T>): ReadonlySelectorToken<T>
export function deposit<T>(state: Selector<T>): SelectorToken<T>
export function deposit<T>(state: WritableState<T>): WritableToken<T>
export function deposit<T>(state: ReadableState<T>): ReadableToken<T>

export function deposit<T, K extends Canonical>(
	state: RegularAtomFamily<T, K>,
): RegularAtomFamilyToken<T, K>
export function deposit<
	T extends Transceiver<any>,
	J extends Json.Serializable,
	K extends Canonical,
>(state: MutableAtomFamily<T, J, K>): MutableAtomFamilyToken<T, J, K>
export function deposit<T>(state: AtomFamily<T, any>): AtomFamilyToken<T, any>
export function deposit<T>(
	state: WritableSelectorFamily<T, any>,
): WritableSelectorFamilyToken<T, any>
export function deposit<T>(
	state: ReadonlySelectorFamily<T, any>,
): ReadonlySelectorFamilyToken<T, any>
export function deposit<T>(
	state: SelectorFamily<T, any>,
): SelectorFamilyToken<T, any>
export function deposit<T>(
	state: WritableFamily<T, any>,
): WritableFamilyToken<T, any>
export function deposit<T>(
	state: ReadableFamily<T, any>,
): ReadableFamilyToken<T, any>

export function deposit<M extends MoleculeConstructor>(
	state: MoleculeFamily<M>,
): MoleculeFamilyToken<M>
export function deposit<M extends MoleculeConstructor>(
	state: Molecule<M>,
): MoleculeToken<M>

export function deposit<T extends Func>(
	state: Transaction<T>,
): TransactionToken<T>

export function deposit(
	state: Molecule<any> | ReadableState<any>,
): MoleculeToken<any> | ReadableToken<any>

export function deposit(
	state:
		| Molecule<any>
		| MoleculeFamily<any>
		| ReadableFamily<any, any>
		| ReadableState<any>
		| Transaction<Func>,
):
	| MoleculeFamilyToken<any>
	| MoleculeToken<any>
	| ReadableFamilyToken<any, any>
	| ReadableToken<any>
	| TransactionToken<Func>

export function deposit(
	state:
		| Molecule<any>
		| MoleculeFamily<any>
		| ReadableFamily<any, any>
		| ReadableState<any>
		| Transaction<Func>,
):
	| MoleculeFamilyToken<any>
	| MoleculeToken<any>
	| ReadableFamilyToken<any, any>
	| ReadableToken<any>
	| TransactionToken<Func> {
	const token = {
		key: state.key,
		type: state.type,
	} as any
	if (`family` in state) {
		token.family = state.family
	}
	return token
}
