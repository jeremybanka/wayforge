import type {
	AtomToken,
	MoleculeFamily,
	MoleculeFamilyToken,
	MoleculeToken,
	MutableAtomToken,
	ReadableToken,
	ReadonlySelectorToken,
	RegularAtomToken,
	SelectorToken,
	TransactionToken,
	WritableSelectorToken,
	WritableToken,
} from "atom.io"
import type { Json } from "atom.io/json"

import type {
	Atom,
	Func,
	Molecule,
	MutableAtom,
	ReadableState,
	ReadonlySelector,
	RegularAtom,
	Selector,
	Transceiver,
	WritableSelector,
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
export function deposit<
	K extends Json.Serializable,
	S extends { [key: string]: any },
	P extends any[],
>(state: Molecule<any>): MoleculeToken<any>
export function deposit<
	K extends Json.Serializable,
	S extends { [key: string]: any },
	P extends any[],
>(state: MoleculeFamily<any>): MoleculeFamilyToken<any>
export function deposit<T extends Func>(
	state: Transaction<T>,
): TransactionToken<T>
export function deposit<T>(state: ReadableState<T>): ReadableToken<T>
export function deposit<T>(
	state:
		| Molecule<any>
		| MoleculeFamily<any>
		| ReadableState<T>
		| ReadonlySelector<T>
		| RegularAtom<T>
		| Transaction<T extends Func ? T : never>
		| WritableSelector<T>
		| (T extends Transceiver<any> ? MutableAtom<T, any> : never),
):
	| MoleculeFamilyToken<any>
	| MoleculeToken<any>
	| MutableAtomToken<T extends Transceiver<any> ? T : never, any>
	| RegularAtomToken<T>
	| SelectorToken<T>
	| TransactionToken<T extends Func ? T : never> {
	const token = {
		key: state.key,
		type: state.type,
	} as any
	if (`family` in state) {
		token.family = state.family
	}
	return token
}
