import type * as AtomIO from "atom.io"
import type { Json } from "atom.io/json"
import { selectJsonFamily } from "atom.io/json"

import type { Store } from ".."
import { IMPLICIT, createAtomFamily } from ".."
import { FamilyTracker } from "./tracker-family"
import type { Transceiver } from "./transceiver"

export function createMutableAtomFamily<
	Core extends Transceiver<any>,
	SerializableCore extends Json.Serializable,
	Key extends string,
>(
	options: AtomIO.MutableAtomFamilyOptions<Core, SerializableCore, Key>,
	store: Store = IMPLICIT.STORE,
): AtomIO.MutableAtomFamily<Core, SerializableCore, Key> {
	const coreFamily = Object.assign(
		createAtomFamily<Core, Key>(options, store),
		options,
	) as AtomIO.MutableAtomFamily<Core, SerializableCore, Key>
	selectJsonFamily(coreFamily, options)
	new FamilyTracker(coreFamily, store)
	return coreFamily
}
