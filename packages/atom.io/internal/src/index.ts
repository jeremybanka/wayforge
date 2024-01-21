import type { FamilyMetadata } from "atom.io"
import type { Json, JsonInterface } from "atom.io/json"

import type { Transceiver } from "./mutable"
import type { Store } from "./store"
import type { Subject } from "./subject"

export * from "./atom"
export * from "./caching"
export * from "./lineage"
export * from "./families"
export * from "./future"
export * from "./get-environment-data"
export * from "./get-state"
export * from "./ingest-updates"
export * from "./keys"
export * from "./lazy-map"
export * from "./mutable"
export * from "./not-found-error"
export * from "./operation"
export * from "./selector"
export * from "./set-state"
export * from "./store"
export * from "./subject"
export * from "./subscribe"
export * from "./timeline"
export * from "./transaction"

export type BaseStateData = {
	key: string
	family?: FamilyMetadata
	install: (store: Store) => void
	subject: Subject<{ newValue: any; oldValue: any }>
}

export type RegularAtom<T> = BaseStateData & {
	type: `atom`
	default: T | (() => T)
	cleanup?: () => void
}
export type MutableAtom<
	T extends Transceiver<any>,
	J extends Json.Serializable,
> = BaseStateData &
	JsonInterface<T, J> & {
		type: `mutable_atom`
		default: T | (() => T)
		cleanup?: () => void
	}
export type Atom<T> =
	| RegularAtom<T>
	| (T extends Transceiver<any> ? MutableAtom<T, any> : never)

export type WritableSelector<T> = BaseStateData & {
	type: `selector`
	get: () => T
	set: (newValue: T | ((oldValue: T) => T)) => void
}
export type ReadonlySelector<T> = BaseStateData & {
	type: `readonly_selector`
	get: () => T
}
export type Selector<T> = ReadonlySelector<T> | WritableSelector<T>

export type WritableState<T> = Atom<T> | WritableSelector<T>
export type ReadableState<T> = Atom<T> | Selector<T>
