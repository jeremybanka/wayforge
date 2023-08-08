import { Subject } from "."
import { deposit } from "./get"
import { markAtomAsDefault } from "./is-default"
import { cacheValue } from "./operation"
import type { Store } from "./store"
import { IMPLICIT } from "./store"
import { target } from "./transaction-internal"
import type { AtomToken, FamilyMetadata, UpdateHandler } from ".."
import { setState, subscribe } from ".."
import type { AtomOptions } from "../atom"

export type Atom<T> = {
	key: string
	type: `atom`
	family?: FamilyMetadata
	subject: Subject<{ newValue: T; oldValue: T }>
	default: T
}

export function atom__INTERNAL<T>(
	options: AtomOptions<T>,
	family?: FamilyMetadata,
	store: Store = IMPLICIT.STORE,
): AtomToken<T> {
	const core = target(store)
	const existing = core.atoms.get(options.key)
	if (existing) {
		store.config.logger?.error?.(
			`Key "${options.key}" already exists in the store.`,
		)
		return deposit(existing)
	}
	const subject = new Subject<{ newValue: T; oldValue: T }>()
	const newAtom = {
		...options,
		subject,
		type: `atom`,
		...(family && { family }),
	} as const
	const initialValue =
		options.default instanceof Function ? options.default() : options.default
	core.atoms.set(newAtom.key, newAtom)
	markAtomAsDefault(options.key, store)
	cacheValue(options.key, initialValue, store)
	const token = deposit(newAtom)
	options.effects?.forEach((effect) =>
		effect({
			setSelf: (next) => setState(token, next, store),
			onSet: (handle: UpdateHandler<T>) => subscribe(token, handle, store),
		}),
	)
	store.subject.atomCreation.next(token)
	return token as AtomToken<T>
}
