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

export function deposit<T>(state: RegularAtom<T>): RegularAtomToken<T>
export function deposit<T extends Transceiver<any, any, any>>(
	state: MutableAtom<T>,
): MutableAtomToken<T>
export function deposit<T>(state: Atom<T>): AtomToken<T>
export function deposit<T>(
	state: WritablePureSelector<T>,
): WritablePureSelectorToken<T>
export function deposit<T>(
	state: ReadonlyPureSelector<T>,
): ReadonlyPureSelectorToken<T>
export function deposit<T>(state: Selector<T>): SelectorToken<T>
export function deposit<T>(state: WritableState<T>): WritableToken<T>
export function deposit<T>(state: ReadableState<T>): ReadableToken<T>

export function deposit<T, K extends Canonical>(
	state: RegularAtomFamily<T, K>,
): RegularAtomFamilyToken<T, K>
export function deposit<
	T extends Transceiver<any, any, any>,
	K extends Canonical,
>(state: MutableAtomFamily<T, K>): MutableAtomFamilyToken<T, K>
export function deposit<T>(state: AtomFamily<T, any>): AtomFamilyToken<T, any>
export function deposit<T>(
	state: WritablePureSelectorFamily<T, any>,
): WritablePureSelectorFamilyToken<T, any>
export function deposit<T>(
	state: ReadonlyPureSelectorFamily<T, any>,
): ReadonlyPureSelectorFamilyToken<T, any>
export function deposit<T>(
	state: SelectorFamily<T, any>,
): SelectorFamilyToken<T, any>
export function deposit<T>(
	state: WritableFamily<T, any>,
): WritableFamilyToken<T, any>
export function deposit<T>(
	state: ReadableFamily<T, any>,
): ReadableFamilyToken<T, any>

export function deposit<T extends Fn>(
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
