import type {
	AtomFamilyToken,
	AtomIOToken,
	AtomToken,
	MutableAtomFamilyToken,
	MutableAtomToken,
	ReadableFamilyToken,
	ReadableToken,
	ReadonlyPureSelectorFamilyToken,
	ReadonlyPureSelectorToken,
	RegularAtomFamilyToken,
	RegularAtomToken,
	SelectorFamilyToken,
	SelectorToken,
	TimelineManageable,
	TimelineToken,
	TransactionToken,
	WritableFamilyToken,
	WritablePureSelectorFamilyToken,
	WritablePureSelectorToken,
	WritableToken,
} from "atom.io"
import type { Canonical } from "atom.io/json"

import type {
	Atom,
	AtomFamily,
	AtomIOInternalResource,
	Fn,
	MutableAtom,
	MutableAtomFamily,
	ReadableFamily,
	ReadableState,
	ReadonlyPureSelector,
	ReadonlyPureSelectorFamily,
	RegularAtom,
	RegularAtomFamily,
	Selector,
	SelectorFamily,
	Timeline,
	Transceiver,
	WritableFamily,
	WritablePureSelector,
	WritablePureSelectorFamily,
	WritableState,
} from ".."
import type { Transaction } from "../transaction"

export function deposit<T, E>(
	state: RegularAtom<T, E>,
): RegularAtomToken<T, Canonical, E>
export function deposit<T extends Transceiver<any, any, any>>(
	state: MutableAtom<T>,
): MutableAtomToken<T>
export function deposit<T, E>(state: Atom<T, E>): AtomToken<T, Canonical, E>
export function deposit<T, E>(
	state: WritablePureSelector<T, E>,
): WritablePureSelectorToken<T, any, E>
export function deposit<T, E>(
	state: ReadonlyPureSelector<T, E>,
): ReadonlyPureSelectorToken<T, any, E>
export function deposit<T, E>(state: Selector<T, E>): SelectorToken<T, any, E>
export function deposit<T, E>(
	state: WritableState<T, E>,
): WritableToken<T, any, E>
export function deposit<T, E>(
	state: ReadableState<T, E>,
): ReadableToken<T, any, E>

export function deposit<T, K extends Canonical, E>(
	state: RegularAtomFamily<T, K, E>,
): RegularAtomFamilyToken<T, K, E>
export function deposit<
	T extends Transceiver<any, any, any>,
	K extends Canonical,
>(state: MutableAtomFamily<T, K>): MutableAtomFamilyToken<T, K>
export function deposit<T, E>(
	state: AtomFamily<T, any, E>,
): AtomFamilyToken<T, any, E>
export function deposit<T, E>(
	state: WritablePureSelectorFamily<T, any, E>,
): WritablePureSelectorFamilyToken<T, any, E>
export function deposit<T, E>(
	state: ReadonlyPureSelectorFamily<T, any, E>,
): ReadonlyPureSelectorFamilyToken<T, any, E>
export function deposit<T, E>(
	state: SelectorFamily<T, any, E>,
): SelectorFamilyToken<T, any, E>
export function deposit<T, E>(
	state: WritableFamily<T, any, E>,
): WritableFamilyToken<T, any, E>
export function deposit<T, E>(
	state: ReadableFamily<T, any, E>,
): ReadableFamilyToken<T, any, E>

export function deposit<T extends Fn>(state: Transaction<T>): TransactionToken<T>
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
