import type {
	MutableAtomToken,
	ReadableToken,
	ReadonlySelectorToken,
	RegularAtomToken,
	SelectorToken,
	TransactionToken,
	WritableSelectorToken,
	WritableToken,
	ƒn,
} from "atom.io"

import type {
	MutableAtom,
	ReadableState,
	ReadonlySelector,
	RegularAtom,
	Transceiver,
	WritableSelector,
	WritableState,
} from ".."
import type { Transaction } from "../transaction"

export function deposit<T>(state: RegularAtom<T>): RegularAtomToken<T>
export function deposit<T extends Transceiver<any>>(
	state: MutableAtom<T, any>,
): MutableAtomToken<T, any>
export function deposit<T>(state: WritableSelector<T>): WritableSelectorToken<T>
export function deposit<T>(state: ReadonlySelector<T>): ReadonlySelectorToken<T>
export function deposit<T>(state: WritableState<T>): WritableToken<T>
export function deposit<T>(
	state: Transaction<T extends ƒn ? T : never>,
): TransactionToken<T>
export function deposit<T>(state: ReadableState<T>): ReadableToken<T>
export function deposit<T>(
	state:
		| ReadonlySelector<T>
		| RegularAtom<T>
		| Transaction<T extends ƒn ? T : never>
		| WritableSelector<T>
		| (T extends Transceiver<any> ? MutableAtom<T, any> : never),
):
	| MutableAtomToken<T extends Transceiver<any> ? T : never, any>
	| RegularAtomToken<T>
	| SelectorToken<T>
	| TransactionToken<T> {
	const token = {
		key: state.key,
		type: state.type,
	} as any
	if (`family` in state) {
		token.family = state.family
	}
	return token
}
