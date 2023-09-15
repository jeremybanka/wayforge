import type { JsonInterface } from "atom.io/json"
import { pipe } from "fp-ts/function"
import type { StoreCore } from ".."
import type { Atom } from "../atom"

export function copyMutableIfNeeded<T>(
	atom: Atom<T>,
	transform: JsonInterface<T>,
	origin: StoreCore,
	target: StoreCore,
): T {
	const originValue = origin.valueMap.get(atom.key)
	const targetValue = target.valueMap.get(atom.key)
	if (originValue === targetValue) {
		const copiedValue = pipe(originValue, transform.toJson, transform.fromJson)
		target.valueMap.set(atom.key, copiedValue)
		return copiedValue
	}
	return targetValue
}
