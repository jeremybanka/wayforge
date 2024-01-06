import type { Transceiver } from "atom.io/internal"
import type { Json } from "atom.io/json"
import type { AtomFamily, AtomFamilyToken } from "./atom"
import type {
	ReadonlySelectorFamily,
	ReadonlySelectorFamilyToken,
	SelectorFamily,
	SelectorFamilyToken,
} from "./selector"

export * from "./atom"
export * from "./dispose"
export * from "./find-state"
export * from "./get-state"
export * from "./logger"
export * from "./selector"
export * from "./set-state"
export * from "./silo"
export * from "./subscribe"
export * from "./timeline"
export * from "./transaction"
export * from "./validators"

export type ƒn = (...parameters: any[]) => any

export type AtomToken<_> = {
	key: string
	type: `atom`
	family?: FamilyMetadata
	__brand?: _
}
export interface MutableAtomToken<
	T extends Transceiver<any>,
	J extends Json.Serializable,
> extends AtomToken<T> {
	__asJSON?: J
	__update?: T extends Transceiver<infer Update> ? Update : never
}
export type SelectorToken<_> = {
	key: string
	type: `selector`
	family?: FamilyMetadata
	__brand?: _
}
/**
 * @deprecated Prefer `WritableToken`.
 */
export type StateToken<T> = AtomToken<T> | SelectorToken<T>
export type WritableToken<T> = AtomToken<T> | SelectorToken<T>
export type ReadableToken<T> = ReadonlySelectorToken<T> | WritableToken<T>

export type WritableFamily<T, K extends Json.Serializable> =
	| AtomFamily<T, K>
	| SelectorFamily<T, K>
export type ReadableFamily<T, K extends Json.Serializable> =
	| ReadonlySelectorFamily<T, K>
	| WritableFamily<T, K>

export type WritableFamilyToken<T, K extends Json.Serializable> =
	| AtomFamilyToken<T, K>
	| SelectorFamilyToken<T, K>
export type ReadableFamilyToken<T, K extends Json.Serializable> =
	| ReadonlySelectorFamilyToken<T, K>
	| WritableFamilyToken<T, K>

export type ReadonlySelectorToken<_> = {
	key: string
	type: `readonly_selector`
	family?: FamilyMetadata
	__brand?: _
}

export type FamilyMetadata = { key: string; subKey: string }
