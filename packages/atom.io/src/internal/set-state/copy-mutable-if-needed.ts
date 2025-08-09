import type { MutableAtom, Transceiver } from ".."
import { Tracker } from "../mutable"
import type { Store } from "../store"

export function copyMutableIfNeeded<T extends Transceiver<any, any>>(
	target: Store,
	atom: MutableAtom<T>,
	origin: Store,
): T {
	const originValue = origin.valueMap.get(atom.key) as
		| Transceiver<any, any>
		| undefined
	const targetValue = target.valueMap.get(atom.key)

	if (originValue !== targetValue) {
		return targetValue
	}

	if (originValue === undefined) {
		return new atom.class()
	}

	origin.logger.info(`📃`, `atom`, atom.key, `copying`)
	const jsonValue = originValue.toJSON()
	const copiedValue = atom.class.fromJSON(jsonValue)
	target.valueMap.set(atom.key, copiedValue)
	new Tracker(atom, origin)
	return copiedValue
}
