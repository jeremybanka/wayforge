import type {
	FamilyMetadata,
	WritablePureSelectorOptions,
	WritablePureSelectorToken,
} from "atom.io"

import type { WritablePureSelector } from ".."
import { writeToCache } from "../caching"
import { newest } from "../lineage"
import type { Store } from "../store"
import { Subject } from "../subject"
import { registerSelector } from "./register-selector"

export function createWritablePureSelector<T>(
	store: Store,
	options: WritablePureSelectorOptions<T>,
	family: FamilyMetadata | undefined,
): WritablePureSelectorToken<T> {
	const target = newest(store)
	const subject = new Subject<{ newValue: T; oldValue: T }>()
	const covered = new Set<string>()
	const key = options.key
	const type = `writable_pure_selector` as const
	store.logger.info(`🔨`, type, key, `is being created`)

	const setterToolkit = registerSelector(target, type, key, covered)
	const { find, get, json } = setterToolkit
	const getterToolkit = { find, get, json }

	const getFrom = (innerTarget: Store): T => {
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

	const mySelector: WritablePureSelector<T> = {
		...options,
		type,
		subject,
		getFrom,
		setSelf,
		install: (s: Store) => createWritablePureSelector(s, options, family),
	}
	if (family) mySelector.family = family

	target.writableSelectors.set(key, mySelector)

	const token: WritablePureSelectorToken<T> = { key, type }
	if (family) token.family = family

	return token
}
