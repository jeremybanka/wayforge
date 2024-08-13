import type {
	FamilyMetadata,
	RegularAtomFamily,
	RegularAtomFamilyOptions,
	RegularAtomFamilyToken,
	RegularAtomOptions,
	RegularAtomToken,
	StateCreation,
	StateDisposal,
} from "atom.io"
import type { Canonical } from "atom.io/json"
import { stringifyJson } from "atom.io/json"

import { createRegularAtom } from "../atom"
import { newest } from "../lineage"
import type { Store } from "../store"
import { Subject } from "../subject"
import { throwInCaseOfConflictingFamily } from "./throw-in-case-of-conflicting-family"

export function createRegularAtomFamily<T, K extends Canonical>(
	options: RegularAtomFamilyOptions<T, K>,
	store: Store,
	internalRoles?: string[],
): RegularAtomFamily<T, K> {
	const familyToken = {
		key: options.key,
		type: `atom_family`,
	} as const satisfies RegularAtomFamilyToken<T, K>

	throwInCaseOfConflictingFamily(familyToken, store)

	const subject = new Subject<
		StateCreation<RegularAtomToken<T>> | StateDisposal<RegularAtomToken<T>>
	>()

	const familyFunction = (key: K): RegularAtomToken<any> => {
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
	}

	const atomFamily: RegularAtomFamily<T, K> = Object.assign(
		familyFunction,
		familyToken,
		{
			subject,
			install: (s: Store) => createRegularAtomFamily(options, s),
			internalRoles,
		},
	) satisfies RegularAtomFamily<T, K>

	store.families.set(options.key, atomFamily)
	return atomFamily
}
