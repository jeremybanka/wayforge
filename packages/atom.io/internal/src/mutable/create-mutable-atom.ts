import type * as AtomIO from "atom.io"
import { createAtom } from "atom.io/internal"
import type { Json } from "atom.io/json"
import { selectJson } from "atom.io/json"
import { tracker } from "./tracker"
import type { Transceiver } from "./tracker-transceiver"

export function createMutableAtom<
	Core extends Transceiver<Json.Serializable>,
	SerializableCore extends Json.Serializable,
>(
	options: AtomIO.MutableAtomOptions<Core, SerializableCore>,
	store?: AtomIO.Store,
): AtomIO.MutableAtomToken<Core, SerializableCore> {
	const coreState = createAtom<Core>(options)
	tracker(coreState, store)
	selectJson(coreState, options, store)
	return coreState as AtomIO.MutableAtomToken<Core, SerializableCore>
}
