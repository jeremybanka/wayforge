import type {
	FamilyMetadata,
	StateUpdate,
	WritablePureSelectorOptions,
	WritablePureSelectorToken,
} from "atom.io"
import type { Canonical } from "atom.io/json"

import type { RootStore, WritablePureSelector } from ".."
import { writeToCache } from "../caching"
import { newest } from "../lineage"
import type { Store } from "../store"
import { Subject } from "../subject"
import { registerSelector } from "./register-selector"

export function createWritablePureSelector<T, K extends Canonical, E>(
	store: Store,
	options: WritablePureSelectorOptions<T, E>,
	family: FamilyMetadata<K> | undefined,
): WritablePureSelectorToken<T, K, E> {
	const target = newest(store)
	const subject = new Subject<StateUpdate<E | T>>()
	const covered = new Set<string>()
	const key = options.key
	const type = `writable_pure_selector` as const
	store.logger.info(`🔨`, type, key, `is being created`)

	const setterToolkit = registerSelector(target, type, key, covered)
	const { find, get, json } = setterToolkit
	const getterToolkit = { find, get, json }

	const getFrom = (innerTarget: Store): E | T => {
		const upstreamStates = innerTarget.selectorGraph.getRelationEntries({
			downstreamSelectorKey: key,
		})
		for (const [downstreamSelectorKey, { source }] of upstreamStates) {
			if (source !== key) {
				innerTarget.selectorGraph.delete(downstreamSelectorKey, key)
			}
		}
		innerTarget.selectorAtoms.delete(key)
		const value = options.get(getterToolkit)
		const cached = writeToCache(innerTarget, mySelector, value)
		store.logger.info(`✨`, type, key, `=`, cached)
		covered.clear()
		return cached
	}

	const setSelf = (newValue: T): void => {
		options.set(setterToolkit, newValue)
	}

	const mySelector: WritablePureSelector<T, E> = {
		...options,
		type,
		subject,
		getFrom,
		setSelf,
		install: (s: RootStore) => createWritablePureSelector(s, options, family),
	}
	if (family) mySelector.family = family

	target.writableSelectors.set(key, mySelector)

	const token: WritablePureSelectorToken<T> = { key, type }
	if (family) token.family = family

	return token
}
