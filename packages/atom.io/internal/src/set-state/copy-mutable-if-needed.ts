import type { JsonInterface } from "atom.io/json"
import { pipe } from "fp-ts/function"

import type { Atom } from "../atom"
import { Tracker } from "../mutable"
import type { Store, StoreCore } from "../store"

export function copyMutableIfNeeded<T>(
	atom: Atom<T>,
	transform: JsonInterface<T>,
	origin: Store,
	target: StoreCore,
): T {
	const originValue = origin.valueMap.get(atom.key)
	const targetValue = target.valueMap.get(atom.key)
	if (originValue === targetValue) {
		origin.config.logger?.info(`📃 copying`, `${atom.key}`)
		const copiedValue = pipe(originValue, transform.toJson, transform.fromJson)
		target.valueMap.set(atom.key, copiedValue)
		new Tracker(atom, origin)
		return copiedValue
	}
	return targetValue
}
