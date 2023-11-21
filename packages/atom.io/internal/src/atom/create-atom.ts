import type {
	AtomOptions,
	AtomToken,
	FamilyMetadata,
	MutableAtomOptions,
	UpdateHandler,
} from "atom.io"
import { setState, subscribe } from "atom.io"

import { cacheValue } from "../caching"
import { createMutableAtom } from "../mutable"
import type { Store } from "../store"
import { IMPLICIT, deposit } from "../store"
import { Subject } from "../subject"
import { target } from "../transaction"
import { markAtomAsDefault } from "./is-default"

export type Atom<T> = {
	key: string
	type: `atom`
	family?: FamilyMetadata
	install: (store: Store) => void
	subject: Subject<{ newValue: T; oldValue: T }>
	default: T
}

export function createAtom<T>(
	options: AtomOptions<T> | MutableAtomOptions<any, any>,
	family?: FamilyMetadata,
	store: Store = IMPLICIT.STORE,
): AtomToken<T> {
	store.logger.info(
		`🔨`,
		`atom`,
		options.key,
		`creating in store "${store.config.name}"`,
	)
	const core = target(store)
	const existing = core.atoms.get(options.key)
	if (existing) {
		store.logger.error(
			`❌`,
			`atom`,
			options.key,
			`Tried to create atom, but it already exists in the store.`,
			`(Ignore if you are in development using hot module replacement.)`,
		)
		return deposit(existing)
	}
	const subject = new Subject<{ newValue: T; oldValue: T }>()
	const newAtom = {
		...options,
		type: `atom`,
		install: (store: Store) => {
			// store.logger.info(
			// 	`🛠️  installing atom "${options.key}" in store "${store.config.name}"`,
			// )
			store.logger.info(
				`🛠️`,
				`atom`,
				options.key,
				`installing in store "${store.config.name}"`,
			)
			return `mutable` in options
				? createMutableAtom(options, store)
				: createAtom(options, undefined, store)
		},
		subject,
		...(family && { family }),
	} as const
	const initialValue =
		options.default instanceof Function ? options.default() : options.default
	core.atoms.set(newAtom.key, newAtom)
	markAtomAsDefault(options.key, store)
	cacheValue(options.key, initialValue, subject, store)
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
