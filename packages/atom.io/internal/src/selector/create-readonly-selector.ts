import type {
	FamilyMetadata,
	ReadonlySelectorOptions,
	ReadonlySelectorToken,
} from "atom.io"

import type { ReadonlySelector } from ".."
import { cacheValue } from "../caching"
import { newest } from "../lineage"
import type { Store } from "../store"
import { Subject } from "../subject"
import { registerSelector } from "./register-selector"

export const createReadonlySelector = <T>(
	options: ReadonlySelectorOptions<T>,
	family: FamilyMetadata | undefined,
	store: Store,
): ReadonlySelectorToken<T> => {
	const target = newest(store)
	const subject = new Subject<{ newValue: T; oldValue: T }>()

	const { get, find } = registerSelector(options.key, target)
	const getSelf = () => {
		const value = options.get({ get, find })
		cacheValue(options.key, value, subject, newest(store))
		return value
	}

	const readonlySelector: ReadonlySelector<T> = {
		...options,
		subject,
		install: (s: Store) => createReadonlySelector(options, family, s),
		get: getSelf,
		type: `readonly_selector`,
		...(family && { family }),
	}
	target.readonlySelectors.set(options.key, readonlySelector)
	const initialValue = getSelf()
	store.logger.info(
		`✨`,
		readonlySelector.type,
		readonlySelector.key,
		`=`,
		initialValue,
	)
	const token: ReadonlySelectorToken<T> = {
		key: options.key,
		type: `readonly_selector`,
	}
	if (family) {
		token.family = family
	}
	store.on.selectorCreation.next(token)
	return token
}
