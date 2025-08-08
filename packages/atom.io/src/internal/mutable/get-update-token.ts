import type { MutableAtomToken, RegularAtomToken } from "atom.io"

import type { SignalFrom, Transceiver } from "./transceiver"

export const getUpdateToken = <T extends Transceiver<any, any>>(
	mutableAtomToken: MutableAtomToken<T>,
): RegularAtomToken<SignalFrom<T>> => {
	const key = `*${mutableAtomToken.key}`
	const updateToken: RegularAtomToken<SignalFrom<T>> = { type: `atom`, key }
	if (mutableAtomToken.family) {
		updateToken.family = {
			key: `*${mutableAtomToken.family.key}`,
			subKey: mutableAtomToken.family.subKey,
		}
	}
	return updateToken
}
