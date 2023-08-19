import { become } from "~/packages/anvl/src/function"

import { Subject, cacheValue } from ".."
import {
	type Store,
	type Selector,
	type StoreCore,
	registerSelector,
	selector__INTERNAL,
} from ".."
import type { FamilyMetadata, SelectorToken } from "../.."
import type { SelectorOptions } from "../../selector"
import { markDone } from "../operation"

export const createReadWriteSelector = <T>(
	options: SelectorOptions<T>,
	family: FamilyMetadata | undefined,
	store: Store,
	core: StoreCore,
): SelectorToken<T> => {
	const subject = new Subject<{ newValue: T; oldValue: T }>()

	const { get, set } = registerSelector(options.key, store)
	const getSelf = () => {
		const value = options.get({ get })
		cacheValue(options.key, value, store)
		return value
	}

	const setSelf = (next: T | ((oldValue: T) => T)): void => {
		const oldValue = getSelf()
		store.config.logger?.info(
			`   <- "${options.key}" went (`,
			oldValue,
			`->`,
			next,
			`)`,
		)
		const newValue = become(next)(oldValue)
		cacheValue(options.key, newValue, store)
		markDone(options.key, store)
		if (store.transactionStatus.phase === `idle`) {
			subject.next({ newValue, oldValue })
		}
		options.set({ get, set }, newValue)
	}
	const mySelector: Selector<T> = {
		...options,
		subject,
		install: (s: Store) => selector__INTERNAL(options, family, s),
		get: getSelf,
		set: setSelf,
		type: `selector`,
		...(family && { family }),
	}
	core.selectors.set(options.key, mySelector)
	const initialValue = getSelf()
	store.config.logger?.info(`   ✨ "${options.key}" =`, initialValue)
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
