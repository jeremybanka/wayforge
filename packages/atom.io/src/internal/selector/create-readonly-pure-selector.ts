import type {
	FamilyMetadata,
	ReadonlyPureSelectorOptions,
	ReadonlyPureSelectorToken,
	StateUpdate,
} from "atom.io"
import type { Canonical } from "atom.io/json"

import { writeToCache } from "../caching"
import { newest } from "../lineage"
import type { ReadonlyPureSelector } from "../state-types"
import type { Store } from "../store"
import { Subject } from "../subject"
import type { RootStore } from "../transaction"
import { registerSelector } from "./register-selector"

export function createReadonlyPureSelector<T, K extends Canonical, E>(
	store: Store,
	options: ReadonlyPureSelectorOptions<T, E>,
	family: FamilyMetadata<K> | undefined,
): ReadonlyPureSelectorToken<T, K, E> {
	const target = newest(store)
	const subject = new Subject<StateUpdate<E | T>>()
	const covered = new Set<string>()
	const key = options.key
	const type = `readonly_pure_selector` as const
	store.logger.info(`🔨`, type, key, `is being created`)

	const { get, find, json } = registerSelector(target, type, key, covered)

	const getFrom = () => {
		const innerTarget = newest(store)
		const upstreamStates = innerTarget.selectorGraph.getRelationEntries({
			downstreamSelectorKey: key,
		})
		for (const [downstreamSelectorKey, { source }] of upstreamStates) {
			if (source !== key) {
				innerTarget.selectorGraph.delete(downstreamSelectorKey, key)
			}
		}
		innerTarget.selectorAtoms.delete(key)
		const value = options.get({ get, find, json })
		const cached = writeToCache(innerTarget, readonlySelector, value)
		store.logger.info(`✨`, type, key, `=`, cached)
		covered.clear()
		return cached
	}

	const readonlySelector: ReadonlyPureSelector<T, E> = {
		...options,
		type,
		subject,
		getFrom,
		install: (s: RootStore) => createReadonlyPureSelector(s, options, family),
	}
	if (family) readonlySelector.family = family

	target.readonlySelectors.set(key, readonlySelector)

	const token: ReadonlyPureSelectorToken<T> = { key, type }
	if (family) token.family = family

	return token
}
