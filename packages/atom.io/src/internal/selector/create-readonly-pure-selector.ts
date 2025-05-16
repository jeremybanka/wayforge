import type {
	FamilyMetadata,
	ReadonlyPureSelectorOptions,
	ReadonlyPureSelectorToken,
} from "atom.io"

import type { ReadonlyPureSelector } from ".."
import { cacheValue } from "../caching"
import { newest } from "../lineage"
import type { Store } from "../store"
import { Subject } from "../subject"
import { registerSelector } from "./register-selector"

export const createReadonlyPureSelector = <T>(
	store: Store,
	options: ReadonlyPureSelectorOptions<T>,
	family: FamilyMetadata | undefined,
): ReadonlyPureSelectorToken<T> => {
	const target = newest(store)
	const subject = new Subject<{ newValue: T; oldValue: T }>()
	const covered = new Set<string>()
	const key = options.key
	const type = `readonly_pure_selector` as const
	const { get, find, json } = registerSelector(target, type, key, covered)
	const getSelf = () => {
		const value = options.get({ get, find, json })
		cacheValue(newest(store), key, value, subject)
		covered.clear()
		return value
	}

	const readonlySelector: ReadonlyPureSelector<T> = {
		...options,
		type,
		subject,
		install: (s: Store) => createReadonlyPureSelector(s, options, family),
		get: getSelf,
		...(family && { family }),
	}
	target.readonlySelectors.set(key, readonlySelector)
	const initialValue = getSelf()
	store.logger.info(`✨`, type, key, `=`, initialValue)
	const token: ReadonlyPureSelectorToken<T> = {
		key,
		type,
	}
	if (family) {
		token.family = family
	}
	return token
}
