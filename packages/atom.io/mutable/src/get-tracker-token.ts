import type { AtomToken } from "atom.io"
import type { Json } from "atom.io/json"
import type { Signal, Transceiver } from "atom.io/tracker"
import type { MutableAtomToken } from "./create-mutable-atom"

export const getTrackerToken = <
	Core extends Transceiver<Json.Serializable>,
	SerializableCore extends Json.Serializable,
>(
	mutableAtomToken: MutableAtomToken<Core, SerializableCore>,
): AtomToken<Signal<Core>> => {
	const key = mutableAtomToken.family
		? `${mutableAtomToken.family.key}:tracker(${mutableAtomToken.family.subKey})`
		: `${mutableAtomToken.key}:tracker`
	const trackerToken: AtomToken<Signal<Core>> = { type: `atom`, key }
	if (mutableAtomToken.family) {
		trackerToken.family = {
			key: `${mutableAtomToken.family.key}:tracker`,
			subKey: mutableAtomToken.family.subKey,
		}
	}
	return trackerToken
}
