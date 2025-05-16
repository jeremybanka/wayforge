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
	const { get, find, json } = registerSelector(options.key, covered, target)
	const getSelf = () => {
		const value = options.get({ get, find, json })
		cacheValue(newest(store), options.key, value, subject)
		covered.clear()
		return value
	}

	const readonlySelector: ReadonlyPureSelector<T> = {
		...options,
		subject,
		install: (s: Store) => createReadonlyPureSelector(s, options, family),
		get: getSelf,
		type: `readonly_pure_selector`,
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
	const token: ReadonlyPureSelectorToken<T> = {
		key: options.key,
		type: `readonly_pure_selector`,
	}
	if (family) {
		token.family = family
	}
	return token
}
