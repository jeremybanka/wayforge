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
	WritableTransientSelectorFamilyToken,
	WritableTransientSelectorToken,
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
	ReadonlyTransientSelector,
	ReadonlyTransientSelectorFamily,
	RegularAtom,
	RegularAtomFamily,
	Selector,
	SelectorFamily,
	Timeline,
	Transceiver,
	WritableFamily,
	WritableTransientSelector,
	WritableTransientSelectorFamily,
	WritableState,
} from ".."
import type { Transaction } from "../transaction"

export function deposit<T>(state: RegularAtom<T>): RegularAtomToken<T>
export function deposit<T extends Transceiver<any>>(
	state: MutableAtom<T, any>,
): MutableAtomToken<T, any>
export function deposit<T>(state: Atom<T>): AtomToken<T>
export function deposit<T>(
	state: WritableTransientSelector<T>,
): WritableTransientSelectorToken<T>
export function deposit<T>(
	state: ReadonlyTransientSelector<T>,
): ReadonlyTransientSelectorToken<T>
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
	state: WritableTransientSelectorFamily<T, any>,
): WritableTransientSelectorFamilyToken<T, any>
export function deposit<T>(
	state: ReadonlyTransientSelectorFamily<T, any>,
): ReadonlyTransientSelectorFamilyToken<T, any>
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
