import type {
	FamilyMetadata,
	ReadonlyPureSelectorOptions,
	ReadonlyPureSelectorToken,
} from "atom.io"

import type { ReadonlyPureSelector } from ".."
import { writeToCache } from "../caching"
import { newest } from "../lineage"
import type { Store } from "../store"
import { Subject } from "../subject"
import { registerSelector } from "./register-selector"

export function createReadonlyPureSelector<T>(
	store: Store,
	options: ReadonlyPureSelectorOptions<T>,
	family: FamilyMetadata | undefined,
): ReadonlyPureSelectorToken<T> {
	const target = newest(store)
	const subject = new Subject<{ newValue: T; oldValue: T }>()
	const covered = new Set<string>()
	const key = options.key
	const type = `readonly_pure_selector` as const
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

	const readonlySelector: ReadonlyPureSelector<T> = {
		...options,
		type,
		subject,
		getFrom,
		install: (s: Store) => createReadonlyPureSelector(s, options, family),
	}
	if (family) {
		readonlySelector.family = family
	}
	target.readonlySelectors.set(key, readonlySelector)
	const token: ReadonlyPureSelectorToken<T> = {
		key,
		type,
	}
	if (family) {
		token.family = family
	}
	return token
}
