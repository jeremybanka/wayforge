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

import type { Transceiver, TransceiverKit } from "./mutable"
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
	subject: Subject<{ newValue: any; oldValue: any }>
}
export type RegularAtom<T> = Flat<
	AtomIOState & {
		type: `atom`
		default: T | (() => T)
		cleanup?: () => void
	}
>
export type MutableAtom<
	J extends Json.Serializable,
	C extends abstract new (
		...args: any[]
	) => Transceiver<any, J>,
	K extends TransceiverKit<J, C>,
> = Flat<
	AtomIOState & {
		type: `mutable_atom`
		class: K
		cleanup?: () => void
	}
>
export type Atom<T> =
	| RegularAtom<T>
	| (T extends Transceiver<any, any>
			? MutableAtom<
					Json.Serializable,
					abstract new (
						...args: any[]
					) => Transceiver<any, any>,
					TransceiverKit<any, any>
				>
			: never)

export type WritableHeldSelector<T> = Flat<
	AtomIOState & {
		type: `writable_held_selector`
		const: T
		get: () => T
		set: (newValue: T | ((oldValue: T) => T)) => void
	}
>
export type ReadonlyHeldSelector<T> = Flat<
	AtomIOState & {
		type: `readonly_held_selector`
		const: T
		get: () => T
	}
>
export type WritablePureSelector<T> = Flat<
	AtomIOState & {
		type: `writable_pure_selector`
		get: () => T
		set: (newValue: T | ((oldValue: T) => T)) => void
	}
>
export type ReadonlyPureSelector<T> = Flat<
	AtomIOState & {
		type: `readonly_pure_selector`
		get: () => T
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
		subject: Subject<StateCreation<AtomToken<T>> | StateDisposal<AtomToken<T>>>
	}

// biome-ignore format: intersection
export type MutableAtomFamily<
T extends Transceiver<any, any>,
J extends Json.Serializable,
K extends Canonical,
> =
	& Flat<
		& JsonInterface<T, J>
		& MutableAtomFamilyToken<T, J, K>
		& {
				install: (store: Store) => void
				internalRoles: string[] | undefined
				subject: Subject<StateCreation<MutableAtomToken<T>> | StateDisposal<MutableAtomToken<T>>>
			}
	>
	& ((key: K) => MutableAtomToken<T>)

export type AtomFamily<T, K extends Canonical = Canonical> =
	| MutableAtomFamily<T extends Transceiver<any, any> ? T : never, any, K>
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
				| StateCreation<WritablePureSelectorToken<T>>
				| StateDisposal<WritablePureSelectorToken<T>>
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
				| StateCreation<WritableHeldSelectorToken<T>>
				| StateDisposal<WritableHeldSelectorToken<T>>
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
				| StateCreation<ReadonlyPureSelectorToken<T>>
				| StateDisposal<ReadonlyPureSelectorToken<T>>
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
				| StateCreation<ReadonlyHeldSelectorToken<T>>
				| StateDisposal<ReadonlyHeldSelectorToken<T>>
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
