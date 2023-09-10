import type { AtomFamily } from "atom.io"
import type { Json, JsonInterface } from "atom.io/json"
import { pipe } from "fp-ts/function"
import { getState__INTERNAL, target } from ".."
import type { Store } from ".."
import type { Atom } from "../atom"

export function copyMutableIfWithinTransaction<T>(
	atom: Atom<T> | (Atom<T> & JsonInterface<T, Json.Serializable>),
	store: Store,
): T {
	if (
		store.transactionStatus.phase === `building` ||
		store.transactionStatus.phase === `applying`
	) {
		// if (store.transactionStatus.key === `dealCards`) debugger
		if (`toJson` in atom && `fromJson` in atom) {
			const copyCreated = copyMutableIfNeeded(atom, atom, store)
			if (copyCreated) {
				return copyCreated
			}
		}
		if (`family` in atom) {
			const family = store.transactionStatus.core.families.get(atom.family.key)
			if (family && family.type === `atom_family`) {
				const result = copyMutableFamilyMemberWithinTransaction(
					atom,
					family,
					store,
				)
				if (result) {
					return result
				}
			}
		}
	}
	return getState__INTERNAL(atom, store)
}

export function copyMutableFamilyMemberWithinTransaction<T>(
	atom: Atom<T>,
	family:
		| AtomFamily<T, any>
		| (AtomFamily<T, any> & JsonInterface<T, Json.Serializable>),
	store: Store,
): T | null {
	if (`toJson` in family && `fromJson` in family) {
		const copyCreated = copyMutableIfNeeded(atom, family, store)
		if (copyCreated) {
			return copyCreated
		}
	}
	return null
}

export function copyMutableIfNeeded<T>(
	atom: Atom<T>,
	transform: JsonInterface<T>,
	store: Store,
): T | null {
	if (store.transactionStatus.phase === `idle`) {
		store.config.logger?.error(
			`Absurd Error: copyMutableIfNeeded called outside of a transaction. This is probably a bug.`,
		)
		return null
	}
	const savedValue = store.valueMap.get(atom.key)
	const transientValue = store.transactionStatus.core.valueMap.get(atom.key)
	if (savedValue === transientValue) {
		const copiedValue = pipe(savedValue, transform.toJson, transform.fromJson)
		store.transactionStatus.core.valueMap.set(atom.key, copiedValue)
		return copiedValue
	}
	return transientValue
}
