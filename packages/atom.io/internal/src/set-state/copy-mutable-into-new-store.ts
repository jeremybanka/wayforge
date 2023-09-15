import type { AtomFamily } from "atom.io"
import type { Json, JsonInterface } from "atom.io/json"
import type { StoreCore } from ".."
import type { Atom } from "../atom"
import { copyMutableIfNeeded } from "./copy-mutable-if-needed"

export function copyMutableIntoNewStore<T>(
	atom: Atom<T> | (Atom<T> & JsonInterface<T, Json.Serializable>),
	origin: StoreCore,
	target: StoreCore,
): void {
	if (`toJson` in atom && `fromJson` in atom) {
		copyMutableIfNeeded(atom, atom, origin, target)
	}
	if (`family` in atom) {
		const family = target.families.get(atom.family.key)
		if (family && family.type === `atom_family`) {
			copyMutableFamilyMemberIntoNewStore(atom, family, origin, target)
		}
	}
}

export function copyMutableFamilyMemberIntoNewStore<T>(
	atom: Atom<T>,
	family:
		| AtomFamily<T, any>
		| (AtomFamily<T, any> & JsonInterface<T, Json.Serializable>),
	origin: StoreCore,
	target: StoreCore,
): void {
	if (`toJson` in family && `fromJson` in family) {
		copyMutableIfNeeded(atom, family, origin, target)
	}
}
