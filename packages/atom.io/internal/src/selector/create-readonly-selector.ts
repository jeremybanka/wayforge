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
	store: Store,
	options: ReadonlySelectorOptions<T>,
	family: FamilyMetadata | undefined,
): ReadonlySelectorToken<T> => {
	const target = newest(store)
	const subject = new Subject<{ newValue: T; oldValue: T }>()
	const covered = new Set<string>()
	const { get, find, json } = registerSelector(options.key, covered, target)
	const getSelf = () => {
		const value = options.get({ get, find, json })
		cacheValue(newest(store), options.key, value, subject)
		covered.clear()
		return value
	}

	const readonlySelector: ReadonlySelector<T> = {
		...options,
		subject,
		install: (s: Store) => createReadonlySelector(s, options, family),
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
