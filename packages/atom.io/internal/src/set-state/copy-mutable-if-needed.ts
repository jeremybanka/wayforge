import type { MutableAtom, Transceiver } from ".."
import { Tracker } from "../mutable"
import type { Store } from "../store"

export function copyMutableIfNeeded<T extends Transceiver<any>>(
	target: Store,
	atom: MutableAtom<T, any>,
	origin: Store,
): T {
	const originValue = origin.valueMap.get(atom.key)
	const targetValue = target.valueMap.get(atom.key)

	if (originValue !== targetValue) {
		return targetValue
	}

	if (originValue === undefined) {
		return atom.default()
	}

	origin.logger.info(`📃`, `atom`, atom.key, `copying`)
	const jsonValue = atom.toJson(originValue)
	const copiedValue = atom.fromJson(jsonValue)
	target.valueMap.set(atom.key, copiedValue)
	new Tracker(atom, origin)
	return copiedValue
}
