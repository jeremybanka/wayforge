import type { ƒn } from "~/packages/anvl/src/function"

import type {
	Atom,
	ReadonlySelector,
	Selector,
	Store,
	Timeline,
	Transaction,
} from ".."
import { target } from ".."
import type {
	AtomToken,
	ReadonlySelectorToken,
	SelectorToken,
	StateToken,
	TimelineToken,
	TransactionToken,
} from "../.."

export function withdraw<T>(token: AtomToken<T>, store: Store): Atom<T> | null
export function withdraw<T>(
	token: SelectorToken<T>,
	store: Store,
): Selector<T> | null
export function withdraw<T>(
	token: StateToken<T>,
	store: Store,
): Atom<T> | Selector<T> | null
export function withdraw<T>(
	token: ReadonlySelectorToken<T>,
	store: Store,
): ReadonlySelector<T> | null
export function withdraw<T>(
	token: TransactionToken<T>,
	store: Store,
): Transaction<T extends ƒn ? T : never> | null
export function withdraw<T>(
	token: ReadonlySelectorToken<T> | StateToken<T>,
	store: Store,
): Atom<T> | ReadonlySelector<T> | Selector<T> | null
export function withdraw<T>(token: TimelineToken, store: Store): Timeline | null
export function withdraw<T>(
	token:
		| ReadonlySelectorToken<T>
		| StateToken<T>
		| TimelineToken
		| TransactionToken<T>,
	store: Store,
):
	| Atom<T>
	| ReadonlySelector<T>
	| Selector<T>
	| Timeline
	| Transaction<T extends ƒn ? T : never>
	| null {
	const core = target(store)
	return (
		core.atoms.get(token.key) ??
		core.selectors.get(token.key) ??
		core.readonlySelectors.get(token.key) ??
		core.transactions.get(token.key) ??
		core.timelines.get(token.key) ??
		null
	)
}
