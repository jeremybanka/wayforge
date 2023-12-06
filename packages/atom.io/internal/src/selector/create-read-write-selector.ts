import type { FamilyMetadata, SelectorOptions, SelectorToken } from "atom.io"

import { cacheValue } from "../caching"
import { markDone } from "../operation"
import { newest } from "../scion"
import { become } from "../set-state/become"
import type { Store } from "../store"
import { Subject } from "../subject"
import type { Selector } from "./create-selector"
import { createSelector } from "./create-selector"
import { registerSelector } from "./register-selector"

export const createReadWriteSelector = <T>(
	options: SelectorOptions<T>,
	family: FamilyMetadata | undefined,
	store: Store,
): SelectorToken<T> => {
	const target = newest(store)
	const subject = new Subject<{ newValue: T; oldValue: T }>()

	const { get, set } = registerSelector(options.key, store)
	const getSelf = () => {
		const value = options.get({ get })
		cacheValue(options.key, value, subject, store)
		return value
	}

	const setSelf = (next: T | ((oldValue: T) => T)): void => {
		const oldValue = getSelf()
		const newValue = become(next)(oldValue)
		// store.logger.info(`📝 set "${options.key}" (`, oldValue, `->`, newValue, `)`)
		store.logger.info(
			`📝`,
			`selector`,
			options.key,
			`set (`,
			oldValue,
			`->`,
			newValue,
			`)`,
		)
		cacheValue(options.key, newValue, subject, store)
		markDone(options.key, store)
		if (target.transactionMeta === null) {
			subject.next({ newValue, oldValue })
		}
		options.set({ get, set }, newValue)
	}
	const mySelector: Selector<T> = {
		...options,
		subject,
		install: (s: Store) => createSelector(options, family, s),
		get: getSelf,
		set: setSelf,
		type: `selector`,
		...(family && { family }),
	}
	target.selectors.set(options.key, mySelector) // ❓
	const initialValue = getSelf()
	store.logger.info(`✨`, mySelector.type, mySelector.key, `=`, initialValue)
	const token: SelectorToken<T> = {
		key: options.key,
		type: `selector`,
	}
	if (family) {
		token.family = family
	}
	store.subject.selectorCreation.next(token)
	return token
}
