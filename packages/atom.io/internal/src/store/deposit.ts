import type {
	ƒn,
	AtomToken,
	ReadonlySelectorToken,
	SelectorToken,
	StateToken,
	TransactionToken,
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
	return {
		key: state.key,
		type: state.type,
		...(`family` in state && { family: state.family }),
	} as any
}
