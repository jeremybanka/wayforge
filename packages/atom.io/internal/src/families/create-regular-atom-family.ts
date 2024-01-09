import type {
	AtomFamilyOptions,
	FamilyMetadata,
	MutableAtomFamilyOptions,
	RegularAtomFamily,
	RegularAtomOptions,
	RegularAtomToken,
} from "atom.io"
import type { Json } from "atom.io/json"
import { stringifyJson } from "atom.io/json"

import { createRegularAtom } from "../atom"
import { newest } from "../lineage"
import { deposit, withdraw } from "../store"
import type { Store } from "../store"
import { Subject } from "../subject"

export function createRegularAtomFamily<T, K extends Json.Serializable>(
	options: AtomFamilyOptions<T, K> | MutableAtomFamilyOptions<any, any, K>,
	store: Store,
): RegularAtomFamily<T, K> {
	const subject = new Subject<RegularAtomToken<T>>()
	const atomFamily: RegularAtomFamily<T, K> = Object.assign(
		(key: K): RegularAtomToken<any> => {
			const subKey = stringifyJson(key)
			const family: FamilyMetadata = { key: options.key, subKey }
			const fullKey = `${options.key}(${subKey})`
			const existing = withdraw({ key: fullKey, type: `atom` }, store)
			let token: RegularAtomToken<any>
			if (existing) {
				token = deposit(existing)
			} else {
				const individualOptions: RegularAtomOptions<any> = {
					key: fullKey,
					default:
						options.default instanceof Function
							? options.default(key)
							: options.default,
				}
				if (options.effects) {
					individualOptions.effects = options.effects(key)
				}
				token = createRegularAtom(individualOptions, family, store)
				subject.next(token)
			}
			return token
		},
		{
			key: options.key,
			type: `atom_family`,
			subject,
			install: (store: Store) => createRegularAtomFamily(options, store),
		} as const,
	)
	const target = newest(store)
	target.families.set(options.key, atomFamily)
	return atomFamily
}
