import * as AtomIO from "atom.io"
import type { Json } from "atom.io/json"
import { selectJsonFamily } from "atom.io/json"
import { trackerFamily } from "./tracker-family"
import type { Transceiver } from "./tracker-transceiver"

export function createMutableAtomFamily<
	Core extends Transceiver<Json.Serializable>,
	SerializableCore extends Json.Serializable,
	Key extends string,
>(
	options: AtomIO.MutableAtomFamilyOptions<Core, SerializableCore, Key>,
): AtomIO.MutableAtomFamily<Core, SerializableCore, Key> {
	const coreFamily = Object.assign(
		AtomIO.atomFamily<Core, Key>(options),
		options,
	) as AtomIO.MutableAtomFamily<Core, SerializableCore, Key>
	selectJsonFamily(coreFamily, options)
	trackerFamily(coreFamily)
	return coreFamily
}
