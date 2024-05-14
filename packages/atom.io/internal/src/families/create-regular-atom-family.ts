import type {
	FamilyMetadata,
	RegularAtomFamily,
	RegularAtomFamilyOptions,
	RegularAtomOptions,
	RegularAtomToken,
} from "atom.io"
import type { Json } from "atom.io/json"
import { stringifyJson } from "atom.io/json"

import { createRegularAtom } from "../atom"
import { NotFoundError } from "../not-found-error"
import { deposit, type Store } from "../store"
import { Subject } from "../subject"

export function createRegularAtomFamily<T, K extends Json.Serializable>(
	options: RegularAtomFamilyOptions<T, K>,
	store: Store,
): RegularAtomFamily<T, K> {
	const subject = new Subject<RegularAtomToken<T>>()

	const atomFamily: RegularAtomFamily<T, K> = Object.assign(
		(key: K): RegularAtomToken<any> => {
			const subKey = stringifyJson(key)
			const family: FamilyMetadata = { key: options.key, subKey }
			const fullKey = `${options.key}(${subKey})`
			const existing = store.atoms.get(fullKey)
			if (existing) {
				return deposit(existing) as RegularAtomToken<T>
			}
			const def = options.default
			const individualOptions: RegularAtomOptions<T> = {
				key: fullKey,
				default: def instanceof Function ? def(key) : def,
			}
			if (options.effects) {
				individualOptions.effects = options.effects(key)
			}
			const token = createRegularAtom(individualOptions, family, store)

			if (store.config.lifespan === `immortal`) {
				throw new NotFoundError(token, store)
			}

			subject.next(token)
			return token
		},
		{
			key: options.key,
			type: `atom_family`,
			subject,
			install: (s: Store) => createRegularAtomFamily(options, s),
		} as const,
	) satisfies RegularAtomFamily<T, K>
	store.families.set(options.key, atomFamily)
	return atomFamily
}
