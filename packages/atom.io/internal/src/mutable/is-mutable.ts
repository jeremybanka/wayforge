import type { AtomFamily, MutableAtomFamily } from "atom.io"

import type { MutableAtom } from "."
import type { Atom } from "../atom"

export function isMutable(atom: Atom<any>): atom is MutableAtom<any>
export function isMutable(
	family: AtomFamily<any, any>,
): family is MutableAtomFamily<any, any, any>
export function isMutable(
	atomOrTokenOrFamily: Atom<any> | AtomFamily<any, any>,
): boolean {
	if (`mutable` in atomOrTokenOrFamily) {
		return atomOrTokenOrFamily.mutable
	}
	return false
}
