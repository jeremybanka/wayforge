import type { FamilyMetadata } from "~/packages/atom.io/src"
import type { Store } from "../store"
import type { Subject } from "../subject"

export * from "./create-standalone-atom"
export * from "./create-regular-atom"
export * from "./delete-atom"
export * from "./is-default"

export type Atom<T> = {
	key: string
	type: `atom`
	mutable?: boolean
	family?: FamilyMetadata
	install: (store: Store) => void
	subject: Subject<{ newValue: T; oldValue: T }>
	default: T | (() => T)
	cleanup?: () => void
}
