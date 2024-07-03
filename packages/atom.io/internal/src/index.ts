import type {
	AtomToken,
	FamilyMetadata,
	MutableAtomFamilyToken,
	MutableAtomToken,
	ReadonlySelectorFamilyToken,
	ReadonlySelectorToken,
	RegularAtomFamilyToken,
	RegularAtomToken,
	StateCreation,
	StateDisposal,
	WritableSelectorFamilyToken,
	WritableSelectorToken,
} from "atom.io"
import type { Canonical, Json, JsonInterface } from "atom.io/json"

import type { Transceiver } from "./mutable"
import type { Store } from "./store"
import type { Subject } from "./subject"

export * from "./arbitrary"
export * from "./atom"
export * from "./caching"
export * from "./families"
export * from "./future"
export * from "./get-environment-data"
export * from "./get-state"
export * from "./ingest-updates"
export * from "./junction"
export * from "./keys"
export * from "./lazy-map"
export * from "./lineage"
export * from "./molecule"
export * from "./mutable"
export * from "./not-found-error"
export * from "./operation"
export * from "./parse-state-overloads"
export * from "./pretty-print"
export * from "./selector"
export * from "./set-state"
export * from "./store"
export * from "./subject"
export * from "./subscribe"
export * from "./timeline"
export * from "./transaction"
export type * from "./utility-types"

export type AtomIOState = {
	key: string
	family?: FamilyMetadata
	install: (store: Store) => void
	subject: Subject<{ newValue: any; oldValue: any }>
}

export type RegularAtom<T> = AtomIOState & {
	type: `atom`
	default: T | (() => T)
	cleanup?: () => void
}
export type MutableAtom<
	T extends Transceiver<any>,
	J extends Json.Serializable,
> = AtomIOState &
	JsonInterface<T, J> & {
		type: `mutable_atom`
		default: T | (() => T)
		cleanup?: () => void
	}
export type Atom<T> =
	| RegularAtom<T>
	| (T extends Transceiver<any> ? MutableAtom<T, any> : never)

export type WritableSelector<T> = AtomIOState & {
	type: `selector`
	get: () => T
	set: (newValue: T | ((oldValue: T) => T)) => void
}
export type ReadonlySelector<T> = AtomIOState & {
	type: `readonly_selector`
	get: () => T
}
export type Selector<T> = ReadonlySelector<T> | WritableSelector<T>

export type WritableState<T> = Atom<T> | WritableSelector<T>
export type ReadableState<T> = Atom<T> | Selector<T>

// biome-ignore format: intersection
export type RegularAtomFamily<T, K extends Canonical> = 
	& RegularAtomFamilyToken<T, K>
	& {
		(key: K): RegularAtomToken<T>
		subject: Subject<StateCreation<AtomToken<T>> | StateDisposal<AtomToken<T>>>
		install: (store: Store) => void
		internalRoles: string[] | undefined
	}

// biome-ignore format: intersection
export type MutableAtomFamily<
T extends Transceiver<any>,
J extends Json.Serializable,
K extends Canonical,
> = 
& JsonInterface<T, J>
& MutableAtomFamilyToken<T, J, K>
& {
		(key: K): MutableAtomToken<T, J>
		subject: Subject<StateCreation<MutableAtomToken<T, J>> | StateDisposal<MutableAtomToken<T, J>>>
		install: (store: Store) => void
		internalRoles: string[] | undefined
	}

export type AtomFamily<T, K extends Canonical = Canonical> =
	| MutableAtomFamily<T extends Transceiver<any> ? T : never, any, K>
	| RegularAtomFamily<T, K>

// biome-ignore format: intersection
export type WritableSelectorFamily<T, K extends Canonical> = 
	& WritableSelectorFamilyToken<T, K> 
	& ((key: K) => WritableSelectorToken<T>)
	& {
		default: (key: K) => T,
		subject: Subject<StateCreation<WritableSelectorToken<T>> | StateDisposal<WritableSelectorToken<T>>>
		install: (store: Store) => void
		internalRoles : string[] | undefined
	}

// biome-ignore format: intersection
export type ReadonlySelectorFamily<T, K extends Canonical> = 
	& ReadonlySelectorFamilyToken<T, K>
	& ((key: K) => ReadonlySelectorToken<T>)
	& {
		default: (key: K) => T,
		subject: Subject<StateCreation<ReadonlySelectorToken<T>> | StateDisposal<ReadonlySelectorToken<T>>>
		install: (store: Store) => void
		internalRoles : string[] | undefined
	}

export type SelectorFamily<T, K extends Canonical> =
	| ReadonlySelectorFamily<T, K>
	| WritableSelectorFamily<T, K>

export type WritableFamily<T, K extends Canonical> =
	| AtomFamily<T, K>
	| WritableSelectorFamily<T, K>
export type ReadableFamily<T, K extends Canonical> =
	| AtomFamily<T, K>
	| SelectorFamily<T, K>
