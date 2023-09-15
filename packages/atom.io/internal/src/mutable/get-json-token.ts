import type { MutableAtomToken, SelectorToken } from "atom.io"
import type { Json } from "atom.io/json"
import type { Transceiver } from "./tracker-transceiver"

export const getJsonToken = <
	Core extends Transceiver<Json.Serializable>,
	SerializableCore extends Json.Serializable,
>(
	mutableAtomToken: MutableAtomToken<Core, SerializableCore>,
): SelectorToken<SerializableCore> => {
	const key = mutableAtomToken.family
		? `${mutableAtomToken.family.key}:JSON(${mutableAtomToken.family.subKey})`
		: `${mutableAtomToken.key}:JSON`
	const jsonToken: SelectorToken<SerializableCore> = { type: `selector`, key }
	if (mutableAtomToken.family) {
		jsonToken.family = {
			key: `${mutableAtomToken.family.key}:JSON`,
			subKey: mutableAtomToken.family.subKey,
		}
	}
	return jsonToken
}
