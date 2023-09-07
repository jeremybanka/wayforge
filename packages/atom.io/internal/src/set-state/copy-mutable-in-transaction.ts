import type { Json, JsonInterface } from "atom.io/json"
import { pipe } from "fp-ts/function"
import { target } from ".."
import type { Store } from ".."
import type { Atom } from "../atom"

export function copyMutableIfWithinTransaction<T>(
	atom: Atom<T> | (Atom<T> & JsonInterface<T, Json.Serializable>),
	store: Store,
): Atom<T> {
	if (store.transactionStatus.phase === `building`) {
		if (`toJson` in atom && `fromJson` in atom) {
			const core = target(store)
			const savedValue = store.valueMap.get(atom.key)
			const transientValue = core.valueMap.get(atom.key)
			if (savedValue === transientValue) {
				const copiedValue = pipe(savedValue, atom.toJson, atom.fromJson)
				core.valueMap.set(atom.key, copiedValue)
				return atom
			}
		}
	}
	return atom
}
