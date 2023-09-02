import type {
	AtomOptions,
	AtomToken,
	FamilyMetadata,
	UpdateHandler,
} from "atom.io"
import { setState, subscribe } from "atom.io"

import { cacheValue } from "../caching"
import type { Store } from "../store"
import { IMPLICIT, deposit } from "../store"
import { Subject } from "../subject"
import { target } from "../transaction"
import { markAtomAsDefault } from "./is-default"

export type Atom<T> = {
	key: string
	type: `atom`
	family?: FamilyMetadata
	subject: Subject<{ newValue: T; oldValue: T }>
	default: T
}

export function createAtom<T>(
	options: AtomOptions<T>,
	family?: FamilyMetadata,
	store: Store = IMPLICIT.STORE,
): AtomToken<T> {
	const core = target(store)
	const existing = core.atoms.get(options.key)
	if (existing) {
		store.config.logger?.info?.(
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
	for (const effect of options.effects ?? []) {
		effect({
			setSelf: (next) => setState(token, next, store),
			onSet: (handle: UpdateHandler<T>) =>
				subscribe(token, handle, `effect[${subject.subscribers.size}]`, store),
		})
	}
	store.subject.atomCreation.next(token)
	return token as AtomToken<T>
}
