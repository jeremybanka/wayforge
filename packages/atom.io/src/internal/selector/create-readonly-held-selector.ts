import type {
	FamilyMetadata,
	ReadonlyHeldSelectorOptions,
	ReadonlyHeldSelectorToken,
} from "atom.io"

import type { ReadonlyHeldSelector } from ".."
import { cacheValue } from "../caching"
import { newest } from "../lineage"
import type { Store } from "../store"
import { Subject } from "../subject"
import { registerSelector } from "./register-selector"

export const createReadonlyHeldSelector = <T extends object>(
	store: Store,
	options: ReadonlyHeldSelectorOptions<T>,
	family: FamilyMetadata | undefined,
): ReadonlyHeldSelectorToken<T> => {
	const target = newest(store)
	const subject = new Subject<{ newValue: T; oldValue: T }>()
	const covered = new Set<string>()
	const { key, default: def } = options
	const type = `readonly_held_selector` as const
	const { get, find, json } = registerSelector(target, type, key, covered)
	const getSelf = () => {
		options.get({ get, find, json }, def)
		cacheValue(newest(store), key, def, subject)
		covered.clear()
		return def
	}

	const readonlySelector: ReadonlyHeldSelector<T> = {
		...options,
		type,
		subject,
		install: (s: Store) => createReadonlyHeldSelector(s, options, family),
		get: getSelf,
		...(family && { family }),
	}
	target.readonlySelectors.set(key, readonlySelector)
	store.logger.info(`✨`, type, key, `=`, def)
	const token: ReadonlyHeldSelectorToken<T> = {
		key,
		type,
	}
	if (family) {
		token.family = family
	}
	return token
}
