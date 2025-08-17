import type {
	FamilyMetadata,
	StateUpdate,
	WritableHeldSelectorOptions,
	WritableHeldSelectorToken,
} from "atom.io"

import type { WritableHeldSelector } from ".."
import { writeToCache } from "../caching"
import { newest } from "../lineage"
import { markDone } from "../operation"
import { become } from "../set-state"
import { dispatchStateUpdate } from "../set-state/dispatch-state-update"
import type { Store } from "../store"
import { Subject } from "../subject"
import { isRootStore } from "../transaction"
import { registerSelector } from "./register-selector"

export const createWritableHeldSelector = <T extends object>(
	store: Store,
	options: WritableHeldSelectorOptions<T>,
	family: FamilyMetadata | undefined,
): WritableHeldSelectorToken<T> => {
	const target = newest(store)
	const subject = new Subject<{ newValue: T; oldValue: T }>()
	const covered = new Set<string>()
	const { key, const: constant } = options
	const type = `writable_held_selector` as const
	const setterToolkit = registerSelector(target, type, key, covered)
	const { find, get, json } = setterToolkit
	const getterToolkit = { find, get, json }

	const getSelf = (getFn = options.get, innerTarget = newest(store)): T => {
		const upstreamStates = innerTarget.selectorGraph.getRelationEntries({
			downstreamSelectorKey: key,
		})
		for (const [downstreamSelectorKey, { source }] of upstreamStates) {
			if (source !== key) {
				innerTarget.selectorGraph.delete(downstreamSelectorKey, key)
			}
		}
		innerTarget.selectorAtoms.delete(key)
		getFn(getterToolkit, constant)
		writeToCache(innerTarget, mySelector, constant)
		store.logger.info(`✨`, type, key, `=`, constant)
		covered.clear()
		return constant
	}

	const setSelf = (next: T | ((oldValue: T) => T)): void => {
		const innerTarget = newest(store)
		become(next)(constant)
		store.logger.info(`📝`, type, key, `set to`, constant)
		markDone(innerTarget, key)
		if (isRootStore(innerTarget)) {
			const update = { oldValue: constant, newValue: constant } as StateUpdate<T>
			dispatchStateUpdate(innerTarget, mySelector, update)
		}
		options.set(setterToolkit, constant)
	}
	const mySelector: WritableHeldSelector<T> = {
		...options,
		type,
		subject,
		install: (s: Store) => createWritableHeldSelector(s, options, family),
		get: getSelf,
		set: setSelf,
	}
	if (family) {
		mySelector.family = family
	}
	target.writableSelectors.set(key, mySelector)

	const token: WritableHeldSelectorToken<T> = { key, type }
	if (family) {
		token.family = family
	}
	return token
}
