import type * as Internal from "atom.io/internal"

import { attachAtomIndex } from "./attach-atom-index"
import { attachSelectorIndex } from "./attach-selector-index"

/**
 * @experimental
 */
export class Auditor {
	public auditorCreatedAt: number = performance.now()
	public statesCreated: Map<string, number> = new Map()
	public readonly atomIndex = attachAtomIndex(this.store)
	public readonly selectorIndex = attachSelectorIndex(this.store)

	private readonly unsubscribeFromAtomCreation =
		this.store.on.atomCreation.subscribe(
			`auditor-${this.auditorCreatedAt}`,
			({ key }) => {
				this.statesCreated.set(key, performance.now())
			},
		)
	private readonly unsubscribeFromAtomDisposal =
		this.store.on.atomDisposal.subscribe(
			`auditor-${this.auditorCreatedAt}`,
			({ key }) => {
				this.statesCreated.delete(key)
			},
		)
	private readonly unsubscribeFromSelectorCreation =
		this.store.on.selectorCreation.subscribe(
			`auditor-${this.auditorCreatedAt}`,
			({ key }) => {
				this.statesCreated.set(key, performance.now())
			},
		)
	private readonly unsubscribeFromSelectorDisposal =
		this.store.on.selectorDisposal.subscribe(
			`auditor-${this.auditorCreatedAt}`,
			({ key }) => {
				this.statesCreated.delete(key)
			},
		)

	public constructor(public readonly store: Internal.Store) {}

	public audit(): void {}

	public [Symbol.dispose](): void {
		this.unsubscribeFromAtomCreation()
		this.unsubscribeFromAtomDisposal()
		this.unsubscribeFromSelectorCreation()
		this.unsubscribeFromSelectorDisposal()
	}
}
