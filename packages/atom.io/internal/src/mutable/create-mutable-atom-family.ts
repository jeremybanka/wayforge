import type {
	FamilyMetadata,
	MutableAtomFamily,
	MutableAtomFamilyOptions,
	MutableAtomOptions,
	MutableAtomToken,
} from "atom.io"
import type { Json } from "atom.io/json"
import { selectJsonFamily, stringifyJson } from "atom.io/json"

import { newest } from "../lineage"
import { createMutableAtom } from "../mutable"
import type { Store } from "../store"
import { Subject } from "../subject"
import { FamilyTracker } from "./tracker-family"
import type { Transceiver } from "./transceiver"

export function createMutableAtomFamily<
	T extends Transceiver<any>,
	J extends Json.Serializable,
	K extends string,
>(
	options: MutableAtomFamilyOptions<T, J, K>,
	store: Store,
): MutableAtomFamily<T, J, K> {
	const subject = new Subject<MutableAtomToken<T, J>>()

	const atomFamily = Object.assign(
		(key: K): MutableAtomToken<T, J> => {
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

			const token = createMutableAtom(individualOptions, family, target)

			subject.next(token)
			return token
		},
		{
			key: options.key,
			type: `mutable_atom_family`,
			subject,
			install: (s: Store) => createMutableAtomFamily(options, s),
			toJson: options.toJson,
			fromJson: options.fromJson,
		} as const,
	) satisfies MutableAtomFamily<T, J, K>
	store.families.set(options.key, atomFamily)
	selectJsonFamily(atomFamily, options, store)
	new FamilyTracker(atomFamily, store)
	return atomFamily
}
