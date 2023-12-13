import type { Transceiver } from "atom.io/internal"
import type { Json } from "atom.io/json"

export * from "./atom"
export * from "./dispose"
export * from "./get-state"
export * from "./logger"
export * from "./selector"
export * from "./set-state"
export * from "./silo"
export * from "./subscribe"
export * from "./timeline"
export * from "./transaction"

export type ƒn = (...parameters: any[]) => any

export type AtomToken<Value, Key extends string = string> = {
	key: Key
	type: `atom`
	family?: FamilyMetadata
	__brand?: Value
}
export interface MutableAtomToken<
	Value extends Transceiver<any>,
	JsonValue extends Json.Serializable,
	Key extends string = string,
> extends AtomToken<Value, Key> {
	__asJSON?: JsonValue
	__update?: Value extends Transceiver<infer Update> ? Update : never
}
export type SelectorToken<Value, Key extends string = string> = {
	key: Key
	type: `selector`
	family?: FamilyMetadata
	__brand?: Value
}
export type StateToken<Value, Key extends string = string> =
	| AtomToken<Value, Key>
	| SelectorToken<Value, Key>

export type ReadonlySelectorToken<Value, Key extends string = string> = {
	key: Key
	type: `readonly_selector`
	family?: FamilyMetadata
	__brand?: Value
}

export type FamilyMetadata = { key: string; subKey: string }
