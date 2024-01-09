import type {
	AtomToken,
	ReadableToken,
	ReadonlySelectorToken,
	TransactionToken,
	WritableSelectorToken,
	WritableToken,
	ƒn,
} from "atom.io"

import type { StateNode } from ".."
import type { Atom } from "../atom"
import type { ReadonlySelector, Selector } from "../selector"
import type { Transaction } from "../transaction"

export function deposit<T>(state: Atom<T>): AtomToken<T>
export function deposit<T>(state: Selector<T>): WritableSelectorToken<T>
export function deposit<T>(state: Atom<T> | Selector<T>): WritableToken<T>
export function deposit<T>(state: ReadonlySelector<T>): ReadonlySelectorToken<T>
export function deposit<T>(
	state: Transaction<T extends ƒn ? T : never>,
): TransactionToken<T>
export function deposit<T>(state: StateNode<T>): ReadableToken<T>
export function deposit<T>(
	state:
		| Atom<T>
		| ReadonlySelector<T>
		| Selector<T>
		| Transaction<T extends ƒn ? T : never>,
):
	| AtomToken<T>
	| ReadonlySelectorToken<T>
	| TransactionToken<T>
	| WritableSelectorToken<T> {
	const token = {
		key: state.key,
		type: state.type,
	} as any
	if (`family` in state) {
		token.family = state.family
	}
	return token
}
