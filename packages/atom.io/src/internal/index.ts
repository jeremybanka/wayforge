import type {
	AtomCreationEvent,
	AtomDisposalEvent,
	FamilyMetadata,
	MutableAtomFamilyToken,
	MutableAtomToken,
	ReadonlyHeldSelectorFamilyToken,
	ReadonlyHeldSelectorToken,
	ReadonlyPureSelectorFamilyToken,
	ReadonlyPureSelectorToken,
	RegularAtomFamilyToken,
	RegularAtomToken,
	SelectorCreationEvent,
	SelectorDisposalEvent,
	StateUpdate,
	WritableHeldSelectorFamilyToken,
	WritableHeldSelectorToken,
	WritablePureSelectorFamilyToken,
	WritablePureSelectorToken,
} from "atom.io"
import type { Canonical } from "atom.io/json"

import type { internalRole } from "./atom/has-role"
import type { ConstructorOf, Transceiver } from "./mutable"
import type { Store } from "./store"
import type { Subject } from "./subject"
import type { Timeline } from "./timeline"
import type { Transaction } from "./transaction"
import type { Flat } from "./utility-types"

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
	subject: Subject<StateUpdate<any>>
}
export type RegularAtom<T> = Flat<
	AtomIOState & {
		type: `atom`
		default: T | (() => T)
		cleanup?: () => void
		internalRoles?: internalRole[]
	}
>
export type MutableAtom<T extends Transceiver<any, any, any>> = Flat<
	AtomIOState & {
		type: `mutable_atom`
		class: ConstructorOf<T>
		cleanup?: () => void
	}
>
export type Atom<T> =
	| RegularAtom<T>
	| (T extends Transceiver<any, any, any> ? MutableAtom<T> : never)

export type WritableHeldSelector<T> = Flat<
	AtomIOState & {
		type: `writable_held_selector`
		const: T
		getFrom: (target: Store) => T
		setSelf: (newValue: T) => void
	}
>
export type ReadonlyHeldSelector<T> = Flat<
	AtomIOState & {
		type: `readonly_held_selector`
		const: T
		getFrom: (target: Store) => T
	}
>
export type WritablePureSelector<T> = Flat<
	AtomIOState & {
		type: `writable_pure_selector`
		getFrom: (target: Store) => T
		setSelf: (newValue: T) => void
	}
>
export type ReadonlyPureSelector<T> = Flat<
	AtomIOState & {
		type: `readonly_pure_selector`
		getFrom: (target: Store) => T
	}
>
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
	Flat<
		& RegularAtomFamilyToken<T, K>
		& {
		  create: (key: K) => RegularAtomToken<T>
			default: T | ((key: K) => T)
			install: (store: Store) => void
			internalRoles: string[] | undefined
			onCreation: Subject<AtomCreationEvent<RegularAtomToken<T>>>
			onDisposal: Subject<AtomDisposalEvent<RegularAtomToken<T>>>
		}
	>

// biome-ignore format: intersection
export type MutableAtomFamily<
	T extends Transceiver<any, any, any>,
	K extends Canonical,
> =
	Flat<
		& MutableAtomFamilyToken<T, K>
		& {
				create: (key: K) => MutableAtomToken<T>
				class: ConstructorOf<T>
				install: (store: Store) => void
				internalRoles: string[] | undefined
				onCreation: Subject<AtomCreationEvent<MutableAtomToken<T>>>
				onDisposal: Subject<AtomDisposalEvent<MutableAtomToken<T>>>
			}
	>

export type AtomFamily<T, K extends Canonical = Canonical> =
	| MutableAtomFamily<T extends Transceiver<any, any, any> ? T : never, K>
	| RegularAtomFamily<T, K>

// biome-ignore format: intersection
export type WritablePureSelectorFamily<T, K extends Canonical> =
	& Flat<
		& WritablePureSelectorFamilyToken<T, K>
		& {
			create: (key: K) => WritablePureSelectorToken<T>
			default: (key: K) => T,
			install: (store: Store) => void
			internalRoles: string[] | undefined
			onCreation: Subject<SelectorCreationEvent<WritablePureSelectorToken<T>>>
			onDisposal: Subject<SelectorDisposalEvent<WritablePureSelectorToken<T>>>
		}
	>

// biome-ignore format: intersection
export type WritableHeldSelectorFamily<T , K extends Canonical> =
	& Flat<
		& WritableHeldSelectorFamilyToken<T, K>
		& {
			create: (key: K) => WritableHeldSelectorToken<T>
			default: (key: K) => T,
			install: (store: Store) => void
			internalRoles: string[] | undefined
			onCreation: Subject<SelectorCreationEvent<WritableHeldSelectorToken<T>>>
			onDisposal: Subject<SelectorDisposalEvent<WritableHeldSelectorToken<T>>>
		}
	>

// biome-ignore format: intersection
export type ReadonlyPureSelectorFamily<T, K extends Canonical> =
	& Flat<
		& ReadonlyPureSelectorFamilyToken<T, K>
		& {
			create: (key: K) => ReadonlyPureSelectorToken<T>
			default: (key: K) => T,
			install: (store: Store) => void
			internalRoles: string[] | undefined
			onCreation: Subject<SelectorCreationEvent<ReadonlyPureSelectorToken<T>>>
			onDisposal: Subject<SelectorDisposalEvent<ReadonlyPureSelectorToken<T>>>
		}
	>

// biome-ignore format: intersection
export type ReadonlyHeldSelectorFamily<T , K extends Canonical> =
	& Flat<
		& ReadonlyHeldSelectorFamilyToken<T, K>
		& {
			create: (key: K) => ReadonlyHeldSelectorToken<T>
			default: (key: K) => T,
			install: (store: Store) => void
			internalRoles: string[] | undefined
			onCreation: Subject<SelectorCreationEvent<ReadonlyHeldSelectorToken<T>>>
			onDisposal: Subject<SelectorDisposalEvent<ReadonlyHeldSelectorToken<T>>>
		}
	>

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
