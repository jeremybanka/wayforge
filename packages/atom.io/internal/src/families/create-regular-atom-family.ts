import type {
	FamilyMetadata,
	RegularAtomFamily,
	RegularAtomFamilyOptions,
	RegularAtomOptions,
	RegularAtomToken,
	StateCreation,
	StateDisposal,
} from "atom.io"
import type { Json } from "atom.io/json"
import { stringifyJson } from "atom.io/json"

import { createRegularAtom } from "../atom"
import { newest } from "../lineage"
import type { Store } from "../store"
import { Subject } from "../subject"

export function createRegularAtomFamily<T, K extends Json.Serializable>(
	options: RegularAtomFamilyOptions<T, K>,
	store: Store,
): RegularAtomFamily<T, K> {
	const subject = new Subject<
		StateCreation<RegularAtomToken<T>> | StateDisposal<RegularAtomToken<T>>
	>()

	const atomFamily: RegularAtomFamily<T, K> = Object.assign(
		(key: K): RegularAtomToken<any> => {
			const subKey = stringifyJson(key)
			const family: FamilyMetadata = { key: options.key, subKey }
			const fullKey = `${options.key}(${subKey})`
			const target = newest(store)

			const def = options.default
			const individualOptions: RegularAtomOptions<T> = {
				key: fullKey,
				default: def instanceof Function ? def(key) : def,
			}
			if (options.effects) {
				individualOptions.effects = options.effects(key)
			}

			const token = createRegularAtom(individualOptions, family, target)

			subject.next({ type: `state_creation`, token })
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
