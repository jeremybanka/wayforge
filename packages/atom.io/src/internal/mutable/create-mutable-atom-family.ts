import type {
	FamilyMetadata,
	MutableAtomFamilyOptions,
	MutableAtomFamilyToken,
	MutableAtomOptions,
	MutableAtomToken,
	StateCreation,
	StateDisposal,
} from "atom.io"
import type { Canonical } from "atom.io/json"
import { stringifyJson } from "atom.io/json"

import {
	createWritablePureSelectorFamily,
	type MutableAtomFamily,
	prettyPrintTokenType,
} from ".."
import { newest } from "../lineage"
import { createMutableAtom } from "../mutable"
import type { Store } from "../store"
import { Subject } from "../subject"
import { FamilyTracker } from "./tracker-family"
import type { Transceiver, TransceiverConstructor } from "./transceiver"

export function createMutableAtomFamily<
	C extends TransceiverConstructor<any, any>,
	K extends Canonical,
>(
	store: Store,
	options: MutableAtomFamilyOptions<C, K>,
	internalRoles?: string[],
): MutableAtomFamilyToken<InstanceType<C>, K> {
	const familyToken: MutableAtomFamilyToken<
		InstanceType<C> & Transceiver<any, any>,
		K
	> = {
		key: options.key,
		type: `mutable_atom_family`,
	}

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
		| StateCreation<MutableAtomToken<InstanceType<C>>>
		| StateDisposal<MutableAtomToken<InstanceType<C>>>
	>()

	const familyFunction = (key: K): MutableAtomToken<InstanceType<C>> => {
		const subKey = stringifyJson(key)
		const family: FamilyMetadata = { key: options.key, subKey }
		const fullKey = `${options.key}(${subKey})`
		const target = newest(store)

		const individualOptions: MutableAtomOptions<C> = {
			key: fullKey,
			class: options.class,
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
		internalRoles,
	}) satisfies MutableAtomFamily<C, K>

	store.families.set(options.key, atomFamily)

	createWritablePureSelectorFamily<ReturnType<InstanceType<C>[`toJSON`]>, K>(
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
