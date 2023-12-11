import type {
	AtomFamily,
	AtomToken,
	MutableAtomFamily,
	MutableAtomToken,
} from "~/packages/atom.io/src"
import type { MutableAtom } from "."
import type { Atom } from "../atom"
import type { Store } from "../store"
import { withdraw } from "../store"

export function isMutable(
	token: AtomToken<any>,
	store: Store,
): token is MutableAtomToken<any, any>
export function isMutable(atom: Atom<any>): atom is MutableAtom<any>
export function isMutable(
	family: AtomFamily<any, any>,
): family is MutableAtomFamily<any, any, any>
export function isMutable(
	atomOrTokenOrFamily: Atom<any> | AtomFamily<any, any> | AtomToken<any>,
	store?: Store,
): boolean {
	if (`mutable` in atomOrTokenOrFamily) {
		return atomOrTokenOrFamily.mutable
	}
	if (atomOrTokenOrFamily.type === `atom_family`) {
		return false
	}
	if (`default` in atomOrTokenOrFamily) {
		return false
	}
	if (!store) {
		throw new Error(`Cannot check mutability without a store`)
	}
	const atom = withdraw(atomOrTokenOrFamily, store)
	if (!atom) {
		throw new Error(`Cannot check mutability without an atom`)
	}
	if (`mutable` in atom) {
		return atom.mutable
	}
	return false
}
