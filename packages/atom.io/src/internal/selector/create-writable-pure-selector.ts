import type {
	FamilyMetadata,
	WritablePureSelectorOptions,
	WritablePureSelectorToken,
} from "atom.io"

import type { WritablePureSelector } from ".."
import { cacheValue } from "../caching"
import { newest } from "../lineage"
import { markDone } from "../operation"
import { become } from "../set-state"
import type { Store } from "../store"
import { Subject } from "../subject"
import { isRootStore } from "../transaction"
import { registerSelector } from "./register-selector"

export const createWritablePureSelector = <T>(
	store: Store,
	options: WritablePureSelectorOptions<T>,
	family: FamilyMetadata | undefined,
): WritablePureSelectorToken<T> => {
	const target = newest(store)
	const subject = new Subject<{ newValue: T; oldValue: T }>()
	const covered = new Set<string>()
	const key = options.key
	const type = `writable_pure_selector` as const
	const setterToolkit = registerSelector(target, type, key, covered)
	const { find, get, json } = setterToolkit
	const getterToolkit = { find, get, json }

	const getSelf = (getFn = options.get, innerTarget = newest(store)): T => {
		const value = getFn(getterToolkit)
		cacheValue(innerTarget, key, value, subject)
		covered.clear()
		return value
	}

	const setSelf = (next: T | ((oldValue: T) => T)): void => {
		const innerTarget = newest(store)
		const oldValue = getSelf(options.get, innerTarget)
		const newValue = become(next)(oldValue)
		store.logger.info(`📝`, type, key, `set (`, oldValue, `->`, newValue, `)`)
		cacheValue(innerTarget, options.key, newValue, subject)
		markDone(innerTarget, options.key)
		if (isRootStore(innerTarget)) {
			subject.next({ newValue, oldValue })
		}
		options.set(setterToolkit, newValue)
	}
	const mySelector: WritablePureSelector<T> = {
		...options,
		type,
		subject,
		install: (s: Store) => createWritablePureSelector(s, options, family),
		get: getSelf,
		set: setSelf,
		...(family && { family }),
	}
	target.writableSelectors.set(key, mySelector)
	const initialValue = getSelf()
	store.logger.info(`✨`, mySelector.type, mySelector.key, `=`, initialValue)
	const token: WritablePureSelectorToken<T> = {
		key,
		type,
	}
	if (family) {
		token.family = family
	}
	return token
}
