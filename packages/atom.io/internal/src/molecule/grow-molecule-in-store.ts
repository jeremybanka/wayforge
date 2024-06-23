import type {
	AtomFamily,
	AtomToken,
	MutableAtomFamily,
	MutableAtomToken,
	ReadableFamily,
	ReadableToken,
	ReadonlySelectorFamily,
	ReadonlySelectorToken,
	RegularAtomFamily,
	RegularAtomToken,
	SelectorFamily,
	SelectorToken,
	WritableFamily,
	WritableSelectorFamily,
	WritableSelectorToken,
	WritableToken,
} from "atom.io"
import type { Json } from "atom.io/json"

import { initFamilyMemberInStore } from "../families"
import type { Transceiver } from "../mutable"
import type { Store } from "../store"
import { isChildStore } from "../transaction"
import type { Molecule } from "./molecule-internal"

export function growMoleculeInStore<
	T extends Transceiver<any>,
	J extends Json.Serializable,
	K extends Json.Serializable,
>(
	molecule: Molecule<any>,
	family: MutableAtomFamily<T, J, K>,
	store: Store,
): MutableAtomToken<T, J>
export function growMoleculeInStore<T, K extends Json.Serializable>(
	molecule: Molecule<any>,
	family: RegularAtomFamily<T, K>,
	store: Store,
): RegularAtomToken<T>
export function growMoleculeInStore<T, K extends Json.Serializable>(
	molecule: Molecule<any>,
	family: AtomFamily<T, K>,
	store: Store,
): AtomToken<T>
export function growMoleculeInStore<T, K extends Json.Serializable>(
	molecule: Molecule<any>,
	family: WritableSelectorFamily<T, K>,
	store: Store,
): WritableSelectorToken<T>
export function growMoleculeInStore<T, K extends Json.Serializable>(
	molecule: Molecule<any>,
	family: ReadonlySelectorFamily<T, K>,
	store: Store,
): ReadonlySelectorToken<T>
export function growMoleculeInStore<T, K extends Json.Serializable>(
	molecule: Molecule<any>,
	family: SelectorFamily<T, K>,
	store: Store,
): SelectorToken<T>
export function growMoleculeInStore<T, K extends Json.Serializable>(
	molecule: Molecule<any>,
	family: WritableFamily<T, K>,
	store: Store,
): WritableToken<T>
export function growMoleculeInStore<T, K extends Json.Serializable>(
	molecule: Molecule<any>,
	family: ReadableFamily<T, K>,
	store: Store,
): ReadableToken<T>
export function growMoleculeInStore(
	molecule: Molecule<any>,
	family: ReadableFamily<any, any>,
	store: Store,
): ReadableToken<any> {
	const stateToken = initFamilyMemberInStore(family, molecule.key, store)
	molecule.tokens.set(stateToken.key, stateToken)
	const isTransaction =
		isChildStore(store) && store.transactionMeta.phase === `building`
	if (!isTransaction) {
		molecule.subject.next({ type: `state_creation`, token: stateToken })
	}
	return stateToken
}
