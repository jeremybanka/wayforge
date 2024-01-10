import type {
	FamilyMetadata,
	WritableSelectorOptions,
	WritableSelectorToken,
} from "atom.io"

import type { WritableSelector } from ".."
import { cacheValue } from "../caching"
import { newest } from "../lineage"
import { markDone } from "../operation"
import { become } from "../set-state/become"
import type { Store } from "../store"
import { Subject } from "../subject"
import { registerSelector } from "./register-selector"

export const createWritableSelector = <T>(
	options: WritableSelectorOptions<T>,
	family: FamilyMetadata | undefined,
	store: Store,
): WritableSelectorToken<T> => {
	const target = newest(store)
	const subject = new Subject<{ newValue: T; oldValue: T }>()
	const transactors = registerSelector(options.key, store)
	const { find, get } = transactors
	const readonlyTransactors = { find, get }

	const getSelf = () => {
		const value = options.get(readonlyTransactors)
		cacheValue(options.key, value, subject, newest(store))
		return value
	}

	const setSelf = (next: T | ((oldValue: T) => T)): void => {
		const oldValue = getSelf()
		const newValue = become(next)(oldValue)
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
		options.set(transactors, newValue)
	}
	const mySelector: WritableSelector<T> = {
		...options,
		subject,
		install: (s: Store) => createWritableSelector(options, family, s),
		get: getSelf,
		set: setSelf,
		type: `selector`,
		...(family && { family }),
	}
	target.selectors.set(options.key, mySelector)
	const initialValue = getSelf()
	store.logger.info(`✨`, mySelector.type, mySelector.key, `=`, initialValue)
	const token: WritableSelectorToken<T> = {
		key: options.key,
		type: `selector`,
	}
	if (family) {
		token.family = family
	}
	store.on.selectorCreation.next(token)
	return token
}
