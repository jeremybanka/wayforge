import type {
	AtomToken,
	FamilyMetadata,
	MutableAtomFamilyToken,
	MutableAtomToken,
	ReadonlyRecyclableSelectorFamilyToken,
	ReadonlyRecyclableSelectorToken,
	ReadonlyTransientSelectorFamilyToken,
	ReadonlyTransientSelectorToken,
	RegularAtomFamilyToken,
	RegularAtomToken,
	StateCreation,
	StateDisposal,
	WritableRecyclableSelectorFamilyToken,
	WritableRecyclableSelectorToken,
	WritableTransientSelectorFamilyToken,
	WritableTransientSelectorToken,
} from "atom.io"
import type { Canonical, Json, JsonInterface } from "atom.io/json"

import type { Transceiver } from "./mutable"
import type { Store } from "./store"
import type { Subject } from "./subject"
import type { Timeline } from "./timeline"
import type { Transaction } from "./transaction"

export * from "./arbitrary"
export * from "./atom"
export * from "./caching"
export * from "./capitalize"
export * from "./families"
export * from "./future"
export * from "./get-environment-data"
export * from "./get-state"
export * from "./get-trace"
export * from "./ingest-updates"
export * from "./install-into-store"
export * from "./join"
export * from "./junction"
export * from "./keys"
export * from "./lazy-map"
export * from "./lineage"
export * from "./molecule"
export * from "./mutable"
export * from "./not-found-error"
export * from "./operation"
export * from "./pretty-print"
export * from "./reserved-keys"
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
		default: () => T
		cleanup?: () => void
	}
export type Atom<T> =
	| RegularAtom<T>
	| (T extends Transceiver<any> ? MutableAtom<T, any> : never)

export type WritableTransientSelector<T> = AtomIOState & {
	type: `writable_transient_selector`
	get: () => T
	set: (newValue: T | ((oldValue: T) => T)) => void
}
export type ReadonlyTransientSelector<T> = AtomIOState & {
	type: `readonly_transient_selector`
	get: () => T
}
export type Selector<T> =
	| ReadonlyTransientSelector<T>
	| WritableTransientSelector<T>

export type WritableState<T> = Atom<T> | WritableTransientSelector<T>
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
export type WritableTransientSelectorFamily<T, K extends Canonical> = 
	& WritableTransientSelectorFamilyToken<T, K> 
	& ((key: K) => WritableTransientSelectorToken<T>)
	& {
		default: (key: K) => T,
		subject: Subject<
			| StateCreation<WritableTransientSelectorToken<T>>
			| StateDisposal<WritableTransientSelectorToken<T>>
		>
		install: (store: Store) => void
		internalRoles : string[] | undefined
	}

// biome-ignore format: intersection
export type WritableRecyclableSelectorFamily<T extends object, K extends Canonical> = 
	& WritableRecyclableSelectorFamilyToken<T, K> 
	& ((key: K) => WritableRecyclableSelectorToken<T>)
	& {
		default: (key: K) => T,
		subject: Subject<
			| StateCreation<WritableRecyclableSelectorToken<T>>
			| StateDisposal<WritableRecyclableSelectorToken<T>>
		>
		install: (store: Store) => void
		internalRoles : string[] | undefined
	}

// biome-ignore format: intersection
export type ReadonlyTransientSelectorFamily<T, K extends Canonical> = 
	& ReadonlyTransientSelectorFamilyToken<T, K>
	& ((key: K) => ReadonlyTransientSelectorToken<T>)
	& {
		default: (key: K) => T,
		subject: Subject<
			| StateCreation<ReadonlyTransientSelectorToken<T>>
			| StateDisposal<ReadonlyTransientSelectorToken<T>>
		>
		install: (store: Store) => void
		internalRoles : string[] | undefined
	}

// biome-ignore format: intersection
export type ReadonlyRecyclableSelectorFamily<T extends object, K extends Canonical> = 
	& ReadonlyRecyclableSelectorFamilyToken<T, K>
	& ((key: K) => ReadonlyRecyclableSelectorToken<T>)
	& {
		default: (key: K) => T,
		subject: Subject<
			| StateCreation<ReadonlyRecyclableSelectorToken<T>> 
			| StateDisposal<ReadonlyRecyclableSelectorToken<T>>
		>
		install: (store: Store) => void
		internalRoles : string[] | undefined
	}

export type TransientSelectorFamily<T, K extends Canonical> =
	| ReadonlyTransientSelectorFamily<T, K>
	| WritableTransientSelectorFamily<T, K>

export type RecyclableSelectorFamily<T extends object, K extends Canonical> =
	| ReadonlyRecyclableSelectorFamily<T, K>
	| WritableRecyclableSelectorFamily<T, K>

export type ReadonlySelectorFamily<T, K extends Canonical> =
	| ReadonlyTransientSelectorFamily<T, K>
	| (T extends object ? ReadonlyRecyclableSelectorFamily<T, K> : never)

export type WritableSelectorFamily<T, K extends Canonical> =
	| WritableTransientSelectorFamily<T, K>
	| (T extends object ? WritableRecyclableSelectorFamily<T, K> : never)

export type SelectorFamily<T, K extends Canonical> =
	| TransientSelectorFamily<T, K>
	| (T extends object ? RecyclableSelectorFamily<T, K> : never)

export type WritableFamily<T, K extends Canonical> =
	| AtomFamily<T, K>
	| WritableTransientSelectorFamily<T, K>
export type ReadableFamily<T, K extends Canonical> =
	| AtomFamily<T, K>
	| SelectorFamily<T, K>

export type AtomIOInternalResource =
	| ReadableFamily<any, any>
	| ReadableState<any>
	| Timeline<any>
	| Transaction<any>
