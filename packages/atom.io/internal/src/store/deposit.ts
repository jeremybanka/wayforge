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
import type { ReadonlySelector, WritableSelector } from "../selector"
import type { Transaction } from "../transaction"

export function deposit<T>(state: Atom<T>): AtomToken<T>
export function deposit<T>(state: WritableSelector<T>): WritableSelectorToken<T>
export function deposit<T>(
	state: Atom<T> | WritableSelector<T>,
): WritableToken<T>
export function deposit<T>(state: ReadonlySelector<T>): ReadonlySelectorToken<T>
export function deposit<T>(
	state: Transaction<T extends ƒn ? T : never>,
): TransactionToken<T>
export function deposit<T>(state: StateNode<T>): ReadableToken<T>
export function deposit<T>(
	state:
		| Atom<T>
		| ReadonlySelector<T>
		| Transaction<T extends ƒn ? T : never>
		| WritableSelector<T>,
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
