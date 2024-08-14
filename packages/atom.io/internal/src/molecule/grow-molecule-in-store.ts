import type {
	AtomFamilyToken,
	AtomToken,
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
	WritableFamilyToken,
	WritableSelectorFamilyToken,
	WritableSelectorToken,
	WritableToken,
} from "atom.io"
import type { Canonical, Json } from "atom.io/json"

import type {
	AtomFamily,
	MutableAtomFamily,
	ReadableFamily,
	ReadonlySelectorFamily,
	RegularAtomFamily,
	SelectorFamily,
	WritableFamily,
	WritableSelectorFamily,
} from ".."
import { initFamilyMemberInStore } from "../families"
import type { Transceiver } from "../mutable"
import type { Store } from "../store"
import { isChildStore } from "../transaction"
import type { Molecule } from "./molecule-internal"

export function growMoleculeInStore<
	T extends Transceiver<any>,
	J extends Json.Serializable,
	K extends Canonical,
>(
	molecule: Molecule<any>,
	family: MutableAtomFamilyToken<T, J, K>,
	store: Store,
): MutableAtomToken<T, J>
export function growMoleculeInStore<T, K extends Canonical>(
	molecule: Molecule<any>,
	family: RegularAtomFamilyToken<T, K>,
	store: Store,
): RegularAtomToken<T>
export function growMoleculeInStore<T, K extends Canonical>(
	molecule: Molecule<any>,
	family: AtomFamilyToken<T, K>,
	store: Store,
): AtomToken<T>
export function growMoleculeInStore<T, K extends Canonical>(
	molecule: Molecule<any>,
	family: WritableSelectorFamilyToken<T, K>,
	store: Store,
): WritableSelectorToken<T>
export function growMoleculeInStore<T, K extends Canonical>(
	molecule: Molecule<any>,
	family: ReadonlySelectorFamilyToken<T, K>,
	store: Store,
): ReadonlySelectorToken<T>
export function growMoleculeInStore<T, K extends Canonical>(
	molecule: Molecule<any>,
	family: SelectorFamilyToken<T, K>,
	store: Store,
): SelectorToken<T>
export function growMoleculeInStore<T, K extends Canonical>(
	molecule: Molecule<any>,
	family: WritableFamilyToken<T, K>,
	store: Store,
): WritableToken<T>
export function growMoleculeInStore<T, K extends Canonical>(
	molecule: Molecule<any>,
	family: ReadableFamilyToken<T, K>,
	store: Store,
): ReadableToken<T>
export function growMoleculeInStore(
	molecule: Molecule<any>,
	family: ReadableFamilyToken<any, any>,
	store: Store,
): ReadableToken<any> {
	const stateToken = initFamilyMemberInStore(family, molecule.key, store)
	molecule.tokens.set(stateToken.key, stateToken)
	const isTransaction =
		isChildStore(store) && store.transactionMeta.phase === `building`
	const moleculeInProgress = store.moleculeInProgress === molecule.key
	if (!isTransaction && !moleculeInProgress) {
		molecule.subject.next({ type: `state_creation`, token: stateToken })
	}
	return stateToken
}
