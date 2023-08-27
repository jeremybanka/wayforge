import type {
	AtomToken,
	ReadonlySelectorToken,
	SelectorToken,
	StateToken,
	TimelineToken,
	TransactionToken,
	ƒn,
} from "atom.io"

import type { Store } from "./store"
import type { Atom } from "../atom"
import type { ReadonlySelector, Selector } from "../selector"
import { addAtomToTimeline, type Timeline } from "../timeline"
import type { Transaction } from "../transaction"
import { target } from "../transaction"

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
	let core = target(store)
	let state =
		core.atoms.get(token.key) ??
		core.selectors.get(token.key) ??
		core.readonlySelectors.get(token.key) ??
		core.transactions.get(token.key) ??
		core.timelines.get(token.key)
	if (state) {
		return state
	}
	if (store.transactionStatus.phase === `applying`) {
		core = store.transactionStatus.core
		state =
			core.atoms.get(token.key) ??
			core.selectors.get(token.key) ??
			core.readonlySelectors.get(token.key) ??
			core.transactions.get(token.key) ??
			core.timelines.get(token.key)

		if (state) {
			store.config.logger?.info(`🛠️ add ${token.type} "${token.key}"`)
			switch (state.type) {
				case `atom`: {
					store.atoms.set(token.key, state)
					store.valueMap.set(token.key, state.default)
					const stateKey = state.key
					const familyKey = state.family?.key
					let timelineKey = core.timelineAtoms.getRelatedId(stateKey)
					if (timelineKey === undefined && typeof familyKey === `string`) {
						timelineKey = core.timelineAtoms.getRelatedId(familyKey)
					}
					const timeline =
						typeof timelineKey === `string`
							? store.timelines.get(timelineKey)
							: undefined

					if (timeline) {
						addAtomToTimeline(state, timeline, store)
					}
					break
				}
				case `selector`:
					core.selectors.set(token.key, state)
					break
				case `readonly_selector`:
					core.readonlySelectors.set(token.key, state)
					break
				case `transaction`:
					core.transactions.set(token.key, state)
					break
				case `timeline`:
					core.timelines.set(token.key, state)
					break
			}
			return state
		}
	}
	return null
}
