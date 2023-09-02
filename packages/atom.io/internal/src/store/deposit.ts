import type {
	AtomToken,
	ReadonlySelectorToken,
	SelectorToken,
	StateToken,
	TransactionToken,
	ƒn,
} from "atom.io"

import type { Atom } from "../atom"
import type { ReadonlySelector, Selector } from "../selector"
import type { Transaction } from "../transaction"

export function deposit<T>(state: Atom<T>): AtomToken<T>
export function deposit<T>(state: Selector<T>): SelectorToken<T>
export function deposit<T>(state: Atom<T> | Selector<T>): StateToken<T>
export function deposit<T>(state: ReadonlySelector<T>): ReadonlySelectorToken<T>
export function deposit<T>(
	state: Transaction<T extends ƒn ? T : never>,
): TransactionToken<T>
export function deposit<T>(
	state: Atom<T> | ReadonlySelector<T> | Selector<T>,
): ReadonlySelectorToken<T> | StateToken<T>
export function deposit<T>(
	state:
		| Atom<T>
		| ReadonlySelector<T>
		| Selector<T>
		| Transaction<T extends ƒn ? T : never>,
):
	| AtomToken<T>
	| ReadonlySelectorToken<T>
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
