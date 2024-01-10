import type { MutableAtomToken, RegularAtomToken } from "atom.io"
import type { Json } from "atom.io/json"
import type { Signal, Transceiver } from "./transceiver"

export const getUpdateToken = <
	Core extends Transceiver<any>,
	SerializableCore extends Json.Serializable,
>(
	mutableAtomToken: MutableAtomToken<Core, SerializableCore>,
): RegularAtomToken<Signal<Core>> => {
	const key = `*${mutableAtomToken.key}`
	const updateToken: RegularAtomToken<Signal<Core>> = { type: `atom`, key }
	if (mutableAtomToken.family) {
		updateToken.family = {
			key: `*${mutableAtomToken.family.key}`,
			subKey: mutableAtomToken.family.subKey,
		}
	}
	return updateToken
}
