import type {
	FamilyMetadata,
	WritableHeldSelectorOptions,
	WritableHeldSelectorToken,
} from "atom.io"

import type { WritableHeldSelector } from ".."
import { cacheValue } from "../caching"
import { newest } from "../lineage"
import { markDone } from "../operation"
import { become } from "../set-state"
import type { Store } from "../store"
import { Subject } from "../subject"
import { isRootStore } from "../transaction"
import { registerSelector } from "./register-selector"

export const createWritableHeldSelector = <T extends object>(
	store: Store,
	options: WritableHeldSelectorOptions<T>,
	family: FamilyMetadata | undefined,
): WritableHeldSelectorToken<T> => {
	const target = newest(store)
	const subject = new Subject<{ newValue: T; oldValue: T }>()
	const covered = new Set<string>()
	const key = options.key
	const type = `writable_held_selector` as const
	const setterToolkit = registerSelector(target, type, key, covered)
	const { find, get, json } = setterToolkit
	const getterToolkit = { find, get, json }
	let def = options.default
	if (typeof def === `function`) {
		def = def()
	}

	const getSelf = (getFn = options.get, innerTarget = newest(store)): T => {
		getFn(getterToolkit, def)
		cacheValue(innerTarget, key, def, subject)
		covered.clear()
		return def
	}

	const setSelf = (next: T | ((oldValue: T) => T)): void => {
		const innerTarget = newest(store)
		const oldValue = getSelf(options.get, innerTarget)
		const newValue = become(next)(oldValue)
		store.logger.info(`📝`, type, key, `set (`, oldValue, `->`, newValue, `)`)
		cacheValue(innerTarget, key, newValue, subject)
		markDone(innerTarget, key)
		if (isRootStore(innerTarget)) {
			subject.next({ newValue, oldValue })
		}
		options.set(setterToolkit, newValue)
	}
	const mySelector: WritableHeldSelector<T> = {
		...options,
		type,
		subject,
		install: (s: Store) => createWritableHeldSelector(s, options, family),
		get: getSelf,
		set: setSelf,
		...(family && { family }),
	}
	target.writableSelectors.set(key, mySelector)
	const initialValue = getSelf()
	store.logger.info(`✨`, type, key, `=`, initialValue)

	const token: WritableHeldSelectorToken<T> = { key, type }
	if (family) {
		token.family = family
	}
	return token
}
