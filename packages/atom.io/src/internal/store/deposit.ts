import type {
	AtomFamilyToken,
	AtomIOToken,
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
	TimelineManageable,
	TimelineToken,
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
	AtomIOInternalResource,
	Func,
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
	Timeline,
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

export function deposit<T extends Func>(
	state: Transaction<T>,
): TransactionToken<T>
export function deposit<M extends TimelineManageable>(
	state: Timeline<M>,
): TimelineToken<M>

export function deposit(resource: AtomIOInternalResource): AtomIOToken

export function deposit(state: AtomIOInternalResource): AtomIOToken {
	const token = {
		key: state.key,
		type: state.type,
	} as any
	if (`family` in state) {
		token.family = state.family
	}
	return token
}
