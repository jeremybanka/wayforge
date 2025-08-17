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
	StateCreationEvent,
	StateDisposalEvent,
	StateLifecycleEvent,
	StateUpdate,
	WritableHeldSelectorFamilyToken,
	WritableHeldSelectorToken,
	WritablePureSelectorFamilyToken,
	WritablePureSelectorToken,
} from "atom.io"
import type { Canonical } from "atom.io/json"

import type { internalRole } from "./atom/has-role"
import type { ConstructorOf, Transceiver } from "./mutable"
import type { OpenOperation } from "./operation"
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
		setInto: (
			target: Store & { operation: OpenOperation },
			next: T | ((oldValue: T) => T),
		) => void
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
		setInto: (
			target: Store & { operation: OpenOperation },
			next: T | ((oldValue: T) => T),
		) => void
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
	& RegularAtomFamilyToken<T, K>
	& {
		(key: K): RegularAtomToken<T>
		install: (store: Store) => void
		internalRoles: string[] | undefined
		subject: Subject<StateCreationEvent<AtomToken<T>> | StateDisposalEvent<AtomToken<T>>>
	}

// biome-ignore format: intersection
export type MutableAtomFamily<
	// C extends TransceiverConstructor<any,any>,
	T extends Transceiver<any, any, any>,
	K extends Canonical,
> =
	& Flat<
		& MutableAtomFamilyToken<T, K>
		& {
				install: (store: Store) => void
				internalRoles: string[] | undefined
				subject: Subject<StateLifecycleEvent<MutableAtomToken<T>>>
			}
	>
	& ((key: K) => MutableAtomToken<T>)

export type AtomFamily<T, K extends Canonical = Canonical> =
	| MutableAtomFamily<T extends Transceiver<any, any, any> ? T : never, K>
	| RegularAtomFamily<T, K>

// biome-ignore format: intersection
export type WritablePureSelectorFamily<T, K extends Canonical> =
	& Flat<
		& WritablePureSelectorFamilyToken<T, K>
		& {
			default: (key: K) => T,
			install: (store: Store) => void
			internalRoles: string[] | undefined
			subject: Subject<
				| StateCreationEvent<WritablePureSelectorToken<T>>
				| StateDisposalEvent<WritablePureSelectorToken<T>>
			>
		}
	>
  & ((key: K) => WritablePureSelectorToken<T>)

// biome-ignore format: intersection
export type WritableHeldSelectorFamily<T , K extends Canonical> =
	& Flat<
		& WritableHeldSelectorFamilyToken<T, K>
		& {
			default: (key: K) => T,
			install: (store: Store) => void
			internalRoles: string[] | undefined
			subject: Subject<
				| StateCreationEvent<WritableHeldSelectorToken<T>>
				| StateDisposalEvent<WritableHeldSelectorToken<T>>
			>
		}
	>
  & ((key: K) => WritableHeldSelectorToken<T>)

// biome-ignore format: intersection
export type ReadonlyPureSelectorFamily<T, K extends Canonical> =
	& Flat<
		& ReadonlyPureSelectorFamilyToken<T, K>
		& {
			default: (key: K) => T,
			install: (store: Store) => void
			internalRoles: string[] | undefined
			subject: Subject<
				| StateCreationEvent<ReadonlyPureSelectorToken<T>>
				| StateDisposalEvent<ReadonlyPureSelectorToken<T>>
			>
		}
	>
	& ((key: K) => ReadonlyPureSelectorToken<T>)

// biome-ignore format: intersection
export type ReadonlyHeldSelectorFamily<T , K extends Canonical> =
	& Flat<
		& ReadonlyHeldSelectorFamilyToken<T, K>
		& {
			default: (key: K) => T,
			install: (store: Store) => void
			internalRoles: string[] | undefined
			subject: Subject<
				| StateCreationEvent<ReadonlyHeldSelectorToken<T>>
				| StateDisposalEvent<ReadonlyHeldSelectorToken<T>>
			>
		}
	>
	& ((key: K) => ReadonlyHeldSelectorToken<T>)

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
