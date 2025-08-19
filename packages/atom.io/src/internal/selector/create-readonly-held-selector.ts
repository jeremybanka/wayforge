import type {
	FamilyMetadata,
	ReadonlyHeldSelectorOptions,
	ReadonlyHeldSelectorToken,
} from "atom.io"

import type { ReadonlyHeldSelector } from ".."
import { writeToCache } from "../caching"
import { newest } from "../lineage"
import type { Store } from "../store"
import { Subject } from "../subject"
import { registerSelector } from "./register-selector"

export function createReadonlyHeldSelector<T extends object>(
	store: Store,
	options: ReadonlyHeldSelectorOptions<T>,
	family: FamilyMetadata | undefined,
): ReadonlyHeldSelectorToken<T> {
	const target = newest(store)
	const subject = new Subject<{ newValue: T; oldValue: T }>()
	const covered = new Set<string>()
	const { key, const: constant } = options
	const type = `readonly_held_selector` as const
	const { get, find, json } = registerSelector(target, type, key, covered)

	const getFrom = (innerTarget: Store) => {
		const upstreamStates = innerTarget.selectorGraph.getRelationEntries({
			downstreamSelectorKey: key,
		})
		for (const [downstreamSelectorKey, { source }] of upstreamStates) {
			if (source !== key) {
				innerTarget.selectorGraph.delete(downstreamSelectorKey, key)
			}
		}
		innerTarget.selectorAtoms.delete(key)
		options.get({ get, find, json }, constant)
		writeToCache(innerTarget, readonlySelector, constant)
		covered.clear()
		return constant
	}

	const readonlySelector: ReadonlyHeldSelector<T> = {
		...options,
		type,
		subject,
		getFrom,
		install: (s: Store) => createReadonlyHeldSelector(s, options, family),
	}
	if (family) {
		readonlySelector.family = family
	}
	target.readonlySelectors.set(key, readonlySelector)
	store.logger.info(`✨`, type, key, `=`, constant)
	const token: ReadonlyHeldSelectorToken<T> = {
		key,
		type,
	}
	if (family) {
		token.family = family
	}
	return token
}
