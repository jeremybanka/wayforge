import type { MutableAtomFamily, MutableAtomFamilyOptions } from "atom.io"
import type { Json } from "atom.io/json"
import { selectJsonFamily } from "atom.io/json"

import type { Store } from ".."
import { createAtomFamily } from ".."
import { FamilyTracker } from "./tracker-family"
import type { Transceiver } from "./transceiver"

export function createMutableAtomFamily<
	Core extends Transceiver<any>,
	SerializableCore extends Json.Serializable,
	Key extends string,
>(
	options: MutableAtomFamilyOptions<Core, SerializableCore, Key>,
	store: Store,
): MutableAtomFamily<Core, SerializableCore, Key> {
	const coreFamily = Object.assign(
		createAtomFamily<Core, Key>(options, store),
		options,
	) as MutableAtomFamily<Core, SerializableCore, Key>
	selectJsonFamily(coreFamily, options)
	new FamilyTracker(coreFamily, store)
	return coreFamily
}
