import type {
	AtomCreationEvent,
	AtomDisposalEvent,
	FamilyMetadata,
	MutableAtomFamilyOptions,
	MutableAtomFamilyToken,
	MutableAtomOptions,
	MutableAtomToken,
} from "atom.io"
import { PRETTY_TOKEN_TYPES } from "atom.io"
import type { Canonical } from "atom.io/json"
import { stringifyJson } from "atom.io/json"

import { createWritablePureSelectorFamily, type MutableAtomFamily } from ".."
import { newest } from "../lineage"
import { createMutableAtom } from "../mutable"
import type { Store } from "../store"
import { Subject } from "../subject"
import { FamilyTracker } from "./tracker-family"
import type { AsJSON, Transceiver } from "./transceiver"

export function createMutableAtomFamily<
	T extends Transceiver<any, any, any>,
	K extends Canonical,
>(
	store: Store,
	options: MutableAtomFamilyOptions<T, K>,
	internalRoles?: string[],
): MutableAtomFamilyToken<T, K> {
	const familyToken: MutableAtomFamilyToken<T & Transceiver<any, any, any>, K> =
		{
			key: options.key,
			type: `mutable_atom_family`,
		}

	const existing = store.families.get(options.key)
	if (existing) {
		store.logger.error(
			`❗`,
			`mutable_atom_family`,
			options.key,
			`Overwriting an existing ${PRETTY_TOKEN_TYPES[existing.type]} "${existing.key}" in store "${store.config.name}". You can safely ignore this warning if it is due to hot module replacement.`,
		)
	}

	const onCreation = new Subject<AtomCreationEvent<MutableAtomToken<T>>>()
	const onDisposal = new Subject<AtomDisposalEvent<MutableAtomToken<T>>>()

	const create = (key: K): MutableAtomToken<T> => {
		const subKey = stringifyJson(key)
		const family: FamilyMetadata = { key: options.key, subKey }
		const fullKey = `${options.key}(${subKey})`
		const target = newest(store)

		const individualOptions: MutableAtomOptions<T> = {
			key: fullKey,
			class: options.class,
		}
		if (options.effects) {
			individualOptions.effects = options.effects(key)
		}

		return createMutableAtom(target, individualOptions, family)
	}

	const atomFamily = {
		...familyToken,
		create,
		class: options.class,
		install: (s: Store) => createMutableAtomFamily(s, options),
		internalRoles,
		onCreation,
		onDisposal,
	} satisfies MutableAtomFamily<T, K>

	store.families.set(options.key, atomFamily)

	createWritablePureSelectorFamily<AsJSON<T>, K>(
		store,
		{
			key: `${options.key}:JSON`,
			get:
				(key) =>
				({ get }) =>
					get(familyToken, key).toJSON(),
			set:
				(key) =>
				({ set }, newValue) => {
					set(familyToken, key, options.class.fromJSON(newValue))
				},
		},
		[`mutable`, `json`],
	)

	new FamilyTracker(atomFamily, store)

	return familyToken
}
