import type {
	FamilyMetadata,
	MutableAtomFamilyOptions,
	MutableAtomFamilyToken,
	MutableAtomOptions,
	MutableAtomToken,
	StateCreation,
	StateDisposal,
} from "atom.io"
import type { Canonical, Json } from "atom.io/json"
import { selectJsonFamily, stringifyJson } from "atom.io/json"

import { type MutableAtomFamily, prettyPrintTokenType } from ".."
import { newest } from "../lineage"
import { createMutableAtom } from "../mutable"
import type { Store } from "../store"
import { Subject } from "../subject"
import { FamilyTracker } from "./tracker-family"
import type { Transceiver } from "./transceiver"

export function createMutableAtomFamily<
	T extends Transceiver<any>,
	J extends Json.Serializable,
	K extends Canonical,
>(
	store: Store,
	options: MutableAtomFamilyOptions<T, J, K>,
	internalRoles?: string[],
): MutableAtomFamilyToken<T, J, K> {
	const familyToken = {
		key: options.key,
		type: `mutable_atom_family`,
	} as const satisfies MutableAtomFamilyToken<T, J, K>

	const existing = store.families.get(options.key)
	if (existing) {
		store.logger.error(
			`❗`,
			`mutable_atom_family`,
			options.key,
			`Overwriting an existing ${prettyPrintTokenType(
				existing,
			)} "${existing.key}" in store "${store.config.name}". You can safely ignore this warning if it is due to hot module replacement.`,
		)
	}

	const subject = new Subject<
		StateCreation<MutableAtomToken<T, J>> | StateDisposal<MutableAtomToken<T, J>>
	>()

	const familyFunction = (key: K): MutableAtomToken<T, J> => {
		const subKey = stringifyJson(key)
		const family: FamilyMetadata = { key: options.key, subKey }
		const fullKey = `${options.key}(${subKey})`
		const target = newest(store)

		const individualOptions: MutableAtomOptions<T, J> = {
			key: fullKey,
			default: () => options.default(key),
			toJson: options.toJson,
			fromJson: options.fromJson,
			mutable: true,
		}
		if (options.effects) {
			individualOptions.effects = options.effects(key)
		}

		const token = createMutableAtom(target, individualOptions, family)

		subject.next({ type: `state_creation`, token })
		return token
	}

	const atomFamily = Object.assign(familyFunction, familyToken, {
		subject,
		install: (s: Store) => createMutableAtomFamily(s, options),
		toJson: options.toJson,
		fromJson: options.fromJson,
		internalRoles,
	}) satisfies MutableAtomFamily<T, J, K>

	store.families.set(options.key, atomFamily)
	selectJsonFamily(store, atomFamily, options)
	new FamilyTracker(atomFamily, store)
	return familyToken
}
