import type {
	AtomToken,
	FamilyMetadata,
	MutableAtomFamilyToken,
	MutableAtomToken,
	ReadonlyHeldSelectorFamilyToken,
	ReadonlyHeldSelectorToken,
	ReadonlyPureSelectorFamilyToken,
	ReadonlyPureSelectorToken,
	RegularAtomFamilyToken,
	RegularAtomToken,
	StateCreation,
	StateDisposal,
	WritableHeldSelectorFamilyToken,
	WritableHeldSelectorToken,
	WritablePureSelectorFamilyToken,
	WritablePureSelectorToken,
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

export type WritableHeldSelector<T> = AtomIOState & {
	type: `writable_held_selector`
	default: T | (() => T)
	get: () => T
	set: (newValue: T | ((oldValue: T) => T)) => void
}
export type ReadonlyHeldSelector<T> = AtomIOState & {
	type: `readonly_held_selector`
	default: T | (() => T)
	get: () => T
}
export type WritablePureSelector<T> = AtomIOState & {
	type: `writable_pure_selector`
	get: () => T
	set: (newValue: T | ((oldValue: T) => T)) => void
}
export type ReadonlyPureSelector<T> = AtomIOState & {
	type: `readonly_pure_selector`
	get: () => T
}
export type ReadonlySelector<T> =
	| ReadonlyHeldSelector<T>
	| ReadonlyPureSelector<T>
export type WritableSelector<T> =
	| WritableHeldSelector<T>
	| WritablePureSelector<T>
export type HeldSelector<T> = ReadonlyHeldSelector<T> | WritableHeldSelector<T>
export type PureSelector<T> = ReadonlyPureSelector<T> | WritablePureSelector<T>
export type Selector<T> =
	| ReadonlyHeldSelector<T>
	| ReadonlyPureSelector<T>
	| WritableHeldSelector<T>
	| WritablePureSelector<T>

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
export type WritablePureSelectorFamily<T, K extends Canonical> = 
	& WritablePureSelectorFamilyToken<T, K> 
	& ((key: K) => WritablePureSelectorToken<T>)
	& {
		default: (key: K) => T,
		subject: Subject<
			| StateCreation<WritablePureSelectorToken<T>>
			| StateDisposal<WritablePureSelectorToken<T>>
		>
		install: (store: Store) => void
		internalRoles : string[] | undefined
	}

// biome-ignore format: intersection
export type WritableHeldSelectorFamily<T , K extends Canonical> = 
	& WritableHeldSelectorFamilyToken<T, K> 
	& ((key: K) => WritableHeldSelectorToken<T>)
	& {
		default: (key: K) => T,
		subject: Subject<
			| StateCreation<WritableHeldSelectorToken<T>>
			| StateDisposal<WritableHeldSelectorToken<T>>
		>
		install: (store: Store) => void
		internalRoles : string[] | undefined
	}

// biome-ignore format: intersection
export type ReadonlyPureSelectorFamily<T, K extends Canonical> = 
	& ReadonlyPureSelectorFamilyToken<T, K>
	& ((key: K) => ReadonlyPureSelectorToken<T>)
	& {
		default: (key: K) => T,
		subject: Subject<
			| StateCreation<ReadonlyPureSelectorToken<T>>
			| StateDisposal<ReadonlyPureSelectorToken<T>>
		>
		install: (store: Store) => void
		internalRoles : string[] | undefined
	}

// biome-ignore format: intersection
export type ReadonlyHeldSelectorFamily<T , K extends Canonical> = 
	& ReadonlyHeldSelectorFamilyToken<T, K>
	& ((key: K) => ReadonlyHeldSelectorToken<T>)
	& {
		default: (key: K) => T,
		subject: Subject<
			| StateCreation<ReadonlyHeldSelectorToken<T>> 
			| StateDisposal<ReadonlyHeldSelectorToken<T>>
		>
		install: (store: Store) => void
		internalRoles : string[] | undefined
	}

export type PureSelectorFamily<T, K extends Canonical> =
	| ReadonlyPureSelectorFamily<T, K>
	| WritablePureSelectorFamily<T, K>

export type HeldSelectorFamily<T, K extends Canonical> =
	| ReadonlyHeldSelectorFamily<T, K>
	| WritableHeldSelectorFamily<T, K>

export type ReadonlySelectorFamily<T, K extends Canonical> =
	| ReadonlyHeldSelectorFamily<T, K>
	| ReadonlyPureSelectorFamily<T, K>

export type WritableSelectorFamily<T, K extends Canonical> =
	| WritableHeldSelectorFamily<T, K>
	| WritablePureSelectorFamily<T, K>

export type SelectorFamily<T, K extends Canonical> =
	| HeldSelectorFamily<T, K>
	| PureSelectorFamily<T, K>

export type WritableFamily<T, K extends Canonical> =
	| AtomFamily<T, K>
	| WritablePureSelectorFamily<T, K>
export type ReadableFamily<T, K extends Canonical> =
	| AtomFamily<T, K>
	| SelectorFamily<T, K>

export type AtomIOInternalResource =
	| ReadableFamily<any, any>
	| ReadableState<any>
	| Timeline<any>
	| Transaction<any>
