import type {
	FamilyMetadata,
	ReadonlySelectorOptions,
	ReadonlySelectorToken,
} from "atom.io"

import { type ReadonlySelector, ReadonlySelectorToolkit } from ".."
import { cacheValue } from "../caching"
import { newest } from "../lineage"
import type { Store } from "../store"
import { Subject } from "../subject"

export const createReadonlySelector = <T>(
	options: ReadonlySelectorOptions<T>,
	family: FamilyMetadata | undefined,
	store: Store,
): ReadonlySelectorToken<T> => {
	const target = newest(store)
	const subject = new Subject<{ newValue: T; oldValue: T }>()
	const covered = new Set<string>()
	const toolkit = new ReadonlySelectorToolkit(options.key, covered, target)
	const getSelf = () => {
		const value = options.get(toolkit)
		cacheValue(options.key, value, subject, newest(store))
		covered.clear()
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
	return token
}
