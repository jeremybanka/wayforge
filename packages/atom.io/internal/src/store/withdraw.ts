import type {
	AtomToken,
	ReadableToken,
	ReadonlySelectorToken,
	SelectorToken,
	StateToken,
	TimelineManageable,
	TimelineToken,
	TransactionToken,
	ƒn,
} from "atom.io"

import type { Atom } from "../atom"
import type { ReadonlySelector, Selector } from "../selector"
import type { Timeline } from "../timeline"
import type { Transaction } from "../transaction"
import type { Store } from "./store"

type Withdrawable<T> =
	| Atom<T>
	| ReadonlySelector<T>
	| Selector<T>
	| Timeline<T extends TimelineManageable ? T : never>
	| Transaction<T extends ƒn ? T : never>

export function withdraw<T>(
	token: AtomToken<T>,
	store: Store,
): Atom<T> | undefined
export function withdraw<T>(
	token: SelectorToken<T>,
	store: Store,
): Selector<T> | undefined
export function withdraw<T>(
	token: StateToken<T>,
	store: Store,
): Atom<T> | Selector<T> | undefined
export function withdraw<T>(
	token: ReadonlySelectorToken<T>,
	store: Store,
): ReadonlySelector<T> | undefined
export function withdraw<T>(
	token: TransactionToken<T>,
	store: Store,
): Transaction<T extends ƒn ? T : never> | undefined
export function withdraw<T>(
	token: ReadableToken<T>,
	store: Store,
): Atom<T> | ReadonlySelector<T> | Selector<T> | undefined
export function withdraw<T>(
	token: TimelineToken<T>,
	store: Store,
): Timeline<T extends TimelineManageable ? T : never> | undefined
export function withdraw<T>(
	token: ReadableToken<T> | TimelineToken<T> | TransactionToken<T>,
	store: Store,
): Withdrawable<T> | undefined {
	let withdrawn: Withdrawable<T> | undefined
	let target: Store | null = store
	while (target !== null) {
		switch (token.type) {
			case `atom`:
				withdrawn = target.atoms.get(token.key)
				break
			case `selector`:
				withdrawn = target.selectors.get(token.key)
				break
			case `readonly_selector`:
				withdrawn = target.readonlySelectors.get(token.key)
				break
			case `timeline`:
				withdrawn = target.timelines.get(token.key)
				break
			case `transaction`:
				withdrawn = target.transactions.get(token.key)
				break
		}
		if (withdrawn) {
			return withdrawn
		}
		target = target.child
	}
}
