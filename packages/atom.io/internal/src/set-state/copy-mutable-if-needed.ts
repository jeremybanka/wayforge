import type { JsonInterface } from "atom.io/json"

import type { Atom } from "../atom"
import { Tracker } from "../mutable"
import type { Store } from "../store"

export function copyMutableIfNeeded<T>(
	atom: Atom<T>,
	transform: JsonInterface<T>,
	origin: Store,
	target: Store,
): T {
	const originValue = origin.valueMap.get(atom.key)
	const targetValue = target.valueMap.get(atom.key)
	if (originValue === targetValue) {
		origin.logger.info(`📃`, `atom`, `${atom.key}`, `copying`)
		const copiedValue = transform.fromJson(transform.toJson(originValue))
		target.valueMap.set(atom.key, copiedValue)
		new Tracker(atom, origin)
		return copiedValue
	}
	return targetValue
}
