import type { AtomToken, MutableAtomToken } from "atom.io"
import type { Json } from "atom.io/json"
import type { Signal, Transceiver } from "./tracker-transceiver"

export const getUpdateToken = <
	Core extends Transceiver<Json.Serializable>,
	SerializableCore extends Json.Serializable,
>(
	mutableAtomToken: MutableAtomToken<Core, SerializableCore>,
): AtomToken<Signal<Core>> => {
	const key = `*${mutableAtomToken.key}`
	const updateToken: AtomToken<Signal<Core>> = { type: `atom`, key }
	if (mutableAtomToken.family) {
		updateToken.family = {
			key: `*${mutableAtomToken.family.key}`,
			subKey: mutableAtomToken.family.subKey,
		}
	}
	return updateToken
}
