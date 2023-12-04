import type { Atom } from "../atom"

export * from "./create-mutable-atom"
export * from "./create-mutable-atom-family"
export * from "./get-json-family"
export * from "./get-json-token"
export * from "./get-update-token"
export * from "./is-atom-token-mutable"
export * from "./tracker"
export * from "./tracker-family"
export * from "./transceiver"

export interface MutableAtom<T> extends Atom<T> {
	mutable: true
}

export const isAtomMutable = <T>(atom: Atom<T>): atom is MutableAtom<T> =>
	`isMutable` in atom
