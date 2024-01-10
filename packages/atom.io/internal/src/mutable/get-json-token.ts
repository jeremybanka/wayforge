import type { MutableAtomToken, WritableSelectorToken } from "atom.io"
import type { Json } from "atom.io/json"

import type { Transceiver } from "./transceiver"

export const getJsonToken = <
	Core extends Transceiver<any>,
	SerializableCore extends Json.Serializable,
>(
	mutableAtomToken: MutableAtomToken<Core, SerializableCore>,
): WritableSelectorToken<SerializableCore> => {
	const key = mutableAtomToken.family
		? `${mutableAtomToken.family.key}:JSON(${mutableAtomToken.family.subKey})`
		: `${mutableAtomToken.key}:JSON`
	const jsonToken: WritableSelectorToken<SerializableCore> = {
		type: `selector`,
		key,
	}
	if (mutableAtomToken.family) {
		jsonToken.family = {
			key: `${mutableAtomToken.family.key}:JSON`,
			subKey: mutableAtomToken.family.subKey,
		}
	}
	return jsonToken
}
