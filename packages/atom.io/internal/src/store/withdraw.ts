import type {
	AtomToken,
	MutableAtomToken,
	ReadableToken,
	ReadonlySelectorToken,
	RegularAtomToken,
	SelectorToken,
	TimelineManageable,
	TimelineToken,
	TransactionToken,
	WritableSelectorToken,
	WritableToken,
	ƒn,
} from "atom.io"

import type {
	Atom,
	MutableAtom,
	ReadableState,
	ReadonlySelector,
	RegularAtom,
	Selector,
	Transceiver,
	WritableSelector,
	WritableState,
} from ".."
import type { Timeline } from "../timeline"
import type { Transaction } from "../transaction"
import type { Store } from "./store"

export type Withdrawable = ReadableState<any> | Timeline<any> | Transaction<any>

export function withdraw<T>(
	token: RegularAtomToken<T>,
	store: Store,
): RegularAtom<T> | undefined
export function withdraw<T extends Transceiver<any>>(
	token: MutableAtomToken<T, any>,
	store: Store,
): MutableAtom<T, any> | undefined
export function withdraw<T>(
	token: AtomToken<T>,
	store: Store,
): Atom<T> | undefined
export function withdraw<T>(
	token: WritableSelectorToken<T>,
	store: Store,
): WritableSelector<T> | undefined
export function withdraw<T>(
	token: ReadonlySelectorToken<T>,
	store: Store,
): ReadonlySelector<T> | undefined
export function withdraw<T>(
	token: SelectorToken<T>,
	store: Store,
): Selector<T> | undefined
export function withdraw<T>(
	token: WritableToken<T>,
	store: Store,
): WritableState<T> | undefined
export function withdraw<T>(
	token: ReadableToken<T>,
	store: Store,
): ReadableState<T> | undefined
export function withdraw<T>(
	token: TransactionToken<T>,
	store: Store,
): Transaction<T extends ƒn ? T : never> | undefined
export function withdraw<T>(
	token: TimelineToken<T>,
	store: Store,
): Timeline<T extends TimelineManageable ? T : never> | undefined
export function withdraw<T>(
	token:
		| RegularAtomToken<T>
		| SelectorToken<T>
		| TimelineToken<T>
		| TransactionToken<T>
		| (T extends Transceiver<any> ? MutableAtomToken<T, any> : never),
	store: Store,
): Withdrawable | undefined {
	let withdrawn: Withdrawable | undefined
	let target: Store | null = store
	while (target !== null) {
		switch (token.type) {
			case `atom`:
			case `mutable_atom`:
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
