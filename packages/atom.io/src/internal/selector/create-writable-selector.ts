import type {
	FamilyMetadata,
	WritableTransientSelectorOptions,
	WritableTransientSelectorToken,
} from "atom.io"

import type { WritableTransientSelector } from ".."
import { cacheValue } from "../caching"
import { newest } from "../lineage"
import { markDone } from "../operation"
import { become } from "../set-state"
import type { Store } from "../store"
import { Subject } from "../subject"
import { isRootStore } from "../transaction"
import { registerSelector } from "./register-selector"

export const createWritableSelector = <T>(
	store: Store,
	options: WritableTransientSelectorOptions<T>,
	family: FamilyMetadata | undefined,
): WritableTransientSelectorToken<T> => {
	const target = newest(store)
	const subject = new Subject<{ newValue: T; oldValue: T }>()
	const covered = new Set<string>()
	const setterToolkit = registerSelector(options.key, covered, target)
	const { find, get, json } = setterToolkit
	const getterToolkit = { find, get, json }

	const getSelf = (getFn = options.get, innerTarget = newest(store)): T => {
		const value = getFn(getterToolkit)
		cacheValue(innerTarget, options.key, value, subject)
		covered.clear()
		return value
	}

	const setSelf = (next: T | ((oldValue: T) => T)): void => {
		const innerTarget = newest(store)
		const oldValue = getSelf(options.get, innerTarget)
		const newValue = become(next)(oldValue)
		store.logger.info(
			`📝`,
			`writable_transient_selector`,
			options.key,
			`set (`,
			oldValue,
			`->`,
			newValue,
			`)`,
		)
		cacheValue(innerTarget, options.key, newValue, subject)
		markDone(innerTarget, options.key)
		if (isRootStore(innerTarget)) {
			subject.next({ newValue, oldValue })
		}
		options.set(setterToolkit, newValue)
	}
	const mySelector: WritableTransientSelector<T> = {
		...options,
		subject,
		install: (s: Store) => createWritableSelector(s, options, family),
		get: getSelf,
		set: setSelf,
		type: `writable_transient_selector`,
		...(family && { family }),
	}
	target.writableSelectors.set(options.key, mySelector)
	const initialValue = getSelf()
	store.logger.info(`✨`, mySelector.type, mySelector.key, `=`, initialValue)
	const token: WritableTransientSelectorToken<T> = {
		key: options.key,
		type: `writable_transient_selector`,
	}
	if (family) {
		token.family = family
	}
	return token
}
