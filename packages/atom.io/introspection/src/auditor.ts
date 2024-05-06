import type { AtomToken, ReadableToken, SelectorToken } from "atom.io"
import * as Internal from "atom.io/internal"

import { getState } from "../../src/get-state"
import type { FamilyNode } from "."
import { attachAtomIndex } from "./attach-atom-index"
import { attachSelectorIndex } from "./attach-selector-index"

export type ListResourcesParam = {
	atomFamilies: boolean
	selectorFamilies: boolean
}

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
				this.statesCreated.set(key, performance.now() - this.auditorCreatedAt)
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
				this.statesCreated.set(key, performance.now() - this.auditorCreatedAt)
			},
		)
	private readonly unsubscribeFromSelectorDisposal =
		this.store.on.selectorDisposal.subscribe(
			`auditor-${this.auditorCreatedAt}`,
			({ key }) => {
				this.statesCreated.delete(key)
			},
		)

	public constructor(
		public readonly store: Internal.Store = Internal.IMPLICIT.STORE,
	) {}

	public static readonly DEFAULT_LIST_RESOURCES_PARAM = {
		atomFamilies: true,
		selectorFamilies: true,
	} satisfies ListResourcesParam
	public listResources(
		param: ListResourcesParam = Auditor.DEFAULT_LIST_RESOURCES_PARAM,
	): (readonly [ReadableToken<unknown>, number])[] {
		const atoms = getState(this.atomIndex)
		const selectors = getState(this.selectorIndex)
		const atomFamilyNodes = [...atoms.values()].filter(
			(node): node is FamilyNode<AtomToken<unknown>> => `familyMembers` in node,
		)
		const selectorFamilyNodes = [...selectors.values()].filter(
			(node): node is FamilyNode<SelectorToken<unknown>> =>
				`familyMembers` in node,
		)
		const currentTime = performance.now()
		const resources: (readonly [ReadableToken<unknown>, number])[] = []
		if (param.atomFamilies) {
			for (const familyNode of atomFamilyNodes) {
				const tokens = familyNode.familyMembers.values()
				for (const token of tokens) {
					const storedTime = this.statesCreated.get(token.key)
					const creationTime = storedTime ?? this.auditorCreatedAt
					const age = currentTime - creationTime
					resources.push([token, age])
				}
			}
		}
		if (param.selectorFamilies) {
			for (const familyNode of selectorFamilyNodes) {
				const tokens = familyNode.familyMembers.values()
				for (const token of tokens) {
					const storedTime = this.statesCreated.get(token.key)
					const creationTime = storedTime ?? this.auditorCreatedAt
					const age = currentTime - creationTime
					resources.push([token, age])
				}
			}
		}
		return resources
	}

	public [Symbol.dispose](): void {
		this.unsubscribeFromAtomCreation()
		this.unsubscribeFromAtomDisposal()
		this.unsubscribeFromSelectorCreation()
		this.unsubscribeFromSelectorDisposal()
	}
}
