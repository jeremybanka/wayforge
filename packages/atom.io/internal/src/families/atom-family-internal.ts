import type {
	AtomFamily,
	AtomFamilyOptions,
	AtomOptions,
	AtomToken,
	FamilyMetadata,
} from "atom.io"
import type { Json } from "atom.io/json"
import { stringifyJson } from "atom.io/json"

import { atom__INTERNAL } from "../atom"
import { IMPLICIT, type Store, deposit, withdraw } from "../store"
import { Subject } from "../subject"

export function atomFamily__INTERNAL<T, K extends Json.Serializable>(
	options: AtomFamilyOptions<T, K>,
	store: Store = IMPLICIT.STORE,
): AtomFamily<T, K> {
	const subject = new Subject<AtomToken<T>>()
	return Object.assign(
		(key: K): AtomToken<T> => {
			const subKey = stringifyJson(key)
			const family: FamilyMetadata = { key: options.key, subKey }
			const fullKey = `${options.key}(${subKey})`
			const existing = withdraw({ key: fullKey, type: `atom` }, store)
			let token: AtomToken<any>
			if (existing) {
				token = deposit(existing)
			} else {
				const individualOptions: AtomOptions<any> = {
					key: fullKey,
					default:
						options.default instanceof Function
							? options.default(key)
							: options.default,
				}
				if (options.effects) {
					individualOptions.effects = options.effects(key)
				}
				token = atom__INTERNAL<T>(individualOptions, family, store)
				subject.next(token)
			}
			return token
		},
		{
			key: options.key,
			type: `atom_family`,
			subject,
		} as const,
	)
}
