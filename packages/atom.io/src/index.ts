import type { Transceiver } from "atom.io/internal"
import type { Canonical, Json } from "atom.io/json"

import type { AtomFamilyToken } from "./atom"
import type {
	SelectorFamilyToken,
	WritableSelectorFamilyToken,
} from "./selector"

export * from "./atom"
export * from "./dispose-state"
export * from "./get-state"
export * from "./logger"
export * from "./molecule"
export * from "./selector"
export * from "./set-state"
export * from "./silo"
export * from "./subscribe"
export * from "./timeline"
export * from "./transaction"
export * from "./validators"

export type RegularAtomToken<T> = {
	key: string
	type: `atom`
	family?: FamilyMetadata
	__T?: T
}
export type MutableAtomToken<
	T extends Transceiver<any>,
	J extends Json.Serializable,
> = {
	key: string
	type: `mutable_atom`
	family?: FamilyMetadata
	__J?: J
	__U?: T extends Transceiver<infer Update> ? Update : never
}
export type AtomToken<T> =
	| MutableAtomToken<T extends Transceiver<any> ? T : never, any>
	| RegularAtomToken<T>

export type WritableSelectorToken<T> = {
	key: string
	type: `selector`
	family?: FamilyMetadata
	__T?: T
}
export type ReadonlySelectorToken<T> = {
	key: string
	type: `readonly_selector`
	family?: FamilyMetadata
	__T?: T
}
export type SelectorToken<T> =
	| ReadonlySelectorToken<T>
	| WritableSelectorToken<T>

export type WritableToken<T> = AtomToken<T> | WritableSelectorToken<T>
export type ReadableToken<T> = AtomToken<T> | SelectorToken<T>

export type WritableFamilyToken<T, K extends Canonical> =
	| AtomFamilyToken<T, K>
	| WritableSelectorFamilyToken<T, K>
export type ReadableFamilyToken<T, K extends Canonical> =
	| AtomFamilyToken<T, K>
	| SelectorFamilyToken<T, K>

export type FamilyMetadata = { key: string; subKey: string }
