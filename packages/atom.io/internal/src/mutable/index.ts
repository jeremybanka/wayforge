import type { Atom } from "../atom"

export * from "./create-mutable-atom"
export * from "./create-mutable-atom-family"
export * from "./get-json-family"
export * from "./get-json-token"
export * from "./get-update-token"
export * from "./get-update-family"
export * from "./tracker"
export * from "./tracker-family"
export * from "./transceiver"

export interface MutableAtom<T> extends Atom<T> {
	mutable: true
}
