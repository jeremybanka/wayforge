import type { Transceiver } from "atom.io/internal"
import type { Canonical, Json, stringified } from "atom.io/json"

import type { AtomFamilyToken } from "./atom"
import type {
	SelectorFamilyToken,
	WritableSelectorFamilyToken,
} from "./selector"

export * from "./allocate"
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

export type RegularAtomToken<T, K extends Canonical = any> = {
	key: string
	type: `atom`
	family?: FamilyMetadata<K>
	__T?: T
}
export type MutableAtomToken<
	T extends Transceiver<any>,
	J extends Json.Serializable,
	K extends Canonical = any,
> = {
	key: string
	type: `mutable_atom`
	family?: FamilyMetadata<K>
	__J?: J
	__U?: T extends Transceiver<infer Update> ? Update : never
}
export type AtomToken<T, K extends Canonical = any> =
	| MutableAtomToken<T extends Transceiver<any> ? T : never, any, K>
	| RegularAtomToken<T, K>

export type WritableSelectorToken<T, K extends Canonical = any> = {
	key: string
	type: `selector`
	family?: FamilyMetadata<K>
	__T?: T
}
export type ReadonlySelectorToken<T, K extends Canonical = any> = {
	key: string
	type: `readonly_selector`
	family?: FamilyMetadata<K>
	__T?: T
}
export type SelectorToken<T, K extends Canonical = any> =
	| ReadonlySelectorToken<T, K>
	| WritableSelectorToken<T, K>

export type WritableToken<T, K extends Canonical = any> =
	| AtomToken<T, K>
	| WritableSelectorToken<T, K>
export type ReadableToken<T, K extends Canonical = any> =
	| AtomToken<T, K>
	| SelectorToken<T, K>

export type WritableFamilyToken<T, K extends Canonical> =
	| AtomFamilyToken<T, K>
	| WritableSelectorFamilyToken<T, K>
export type ReadableFamilyToken<T, K extends Canonical> =
	| AtomFamilyToken<T, K>
	| SelectorFamilyToken<T, K>

export type FamilyMetadata<K extends Canonical = any> = {
	key: string
	subKey: stringified<K>
}
