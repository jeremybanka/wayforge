import type { Transceiver } from "atom.io/internal"
import type { Json } from "atom.io/json"

export * from "./atom"
export * from "./get-set"
export * from "./logger"
export * from "./selector"
export * from "./silo"
export * from "./subscribe"
export * from "./timeline"
export * from "./transaction"

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
export type StateToken<T> = AtomToken<T> | SelectorToken<T>

export type ReadonlySelectorToken<_> = {
	key: string
	type: `readonly_selector`
	family?: FamilyMetadata
	__brand?: _
}

export type FamilyMetadata = { key: string; subKey: string }
