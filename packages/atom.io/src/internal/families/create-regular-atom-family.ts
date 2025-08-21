import type {
	FamilyMetadata,
	RegularAtomFamilyOptions,
	RegularAtomFamilyToken,
	RegularAtomOptions,
	RegularAtomToken,
	StateLifecycleEvent,
} from "atom.io"
import { PRETTY_TOKEN_TYPES } from "atom.io"
import type { Canonical } from "atom.io/json"
import { stringifyJson } from "atom.io/json"

import type { RegularAtomFamily } from ".."
import { createRegularAtom } from "../atom"
import { newest } from "../lineage"
import type { Store } from "../store"
import { Subject } from "../subject"

export function createRegularAtomFamily<T, K extends Canonical>(
	store: Store,
	options: RegularAtomFamilyOptions<T, K>,
	internalRoles?: string[],
): RegularAtomFamilyToken<T, K> {
	const familyToken = {
		key: options.key,
		type: `atom_family`,
	} as const satisfies RegularAtomFamilyToken<T, K>

	const existing = store.families.get(options.key)
	if (existing) {
		store.logger.error(
			`❗`,
			`atom_family`,
			options.key,
			`Overwriting an existing ${PRETTY_TOKEN_TYPES[existing.type]} "${existing.key}" in store "${store.config.name}". You can safely ignore this warning if it is due to hot module replacement.`,
		)
	}

	const subject = new Subject<StateLifecycleEvent<RegularAtomToken<T>>>()

	const familyFunction = (key: K): RegularAtomToken<any> => {
		const subKey = stringifyJson(key)
		const family: FamilyMetadata = { key: options.key, subKey }
		const fullKey = `${options.key}(${subKey})`
		const target = newest(store)

		const def = options.default
		const individualOptions: RegularAtomOptions<T> = {
			key: fullKey,
			default: def instanceof Function ? () => def(key) : def,
		}
		if (options.effects) {
			individualOptions.effects = options.effects(key)
		}

		const token = createRegularAtom(target, individualOptions, family)

		subject.next({ type: `state_creation`, token, timestamp: Date.now() })
		return token
	}

	const atomFamily = Object.assign(familyFunction, familyToken, {
		default: options.default,
		subject,
		install: (s: Store) => createRegularAtomFamily(s, options),
		internalRoles,
	}) satisfies RegularAtomFamily<T, K>

	store.families.set(options.key, atomFamily)
	if (options.default instanceof Function === false) {
		store.defaults.set(options.key, options.default)
	}
	return familyToken
}
