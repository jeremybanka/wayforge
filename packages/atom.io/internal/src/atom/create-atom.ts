import type {
	AtomOptions,
	AtomToken,
	FamilyMetadata,
	MutableAtomOptions,
	UpdateHandler,
} from "atom.io"
import { setState } from "atom.io"

import type { Atom } from "."
import { cacheValue } from "../caching"
import { newest } from "../lineage"
import { createMutableAtom } from "../mutable"
import type { Store } from "../store"
import { deposit } from "../store"
import { Subject } from "../subject"
import { subscribeToState } from "../subscribe"
import { markAtomAsDefault } from "./is-default"

export function createAtom<T>(
	options: AtomOptions<T> | MutableAtomOptions<any, any>,
	family: FamilyMetadata | undefined,
	store: Store,
): AtomToken<T> {
	store.logger.info(
		`🔨`,
		`atom`,
		options.key,
		`creating in store "${store.config.name}"`,
	)
	const target = newest(store)
	const existing = target.atoms.get(options.key)
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
	const newAtom: Atom<T> = {
		...options,
		type: `atom`,
		install: (store: Store) => {
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
	let initialValue = options.default
	if (options.default instanceof Function) {
		initialValue = options.default()
	}
	target.atoms.set(newAtom.key, newAtom)
	markAtomAsDefault(options.key, store)
	cacheValue(options.key, initialValue, subject, store)
	const token = deposit(newAtom)
	if (options.effects) {
		let effectIndex = 0
		const cleanupFunctions: (() => void)[] = []
		for (const effect of options.effects) {
			const cleanup = effect({
				setSelf: (next) => setState(token, next, store),
				onSet: (handle: UpdateHandler<T>) =>
					subscribeToState(token, handle, `effect[${effectIndex}]`, store),
			})
			if (cleanup) {
				cleanupFunctions.push(cleanup)
			}
			++effectIndex
		}
		newAtom.cleanup = () => {
			for (const cleanup of cleanupFunctions) {
				cleanup()
			}
		}
	}
	store.subject.atomCreation.next(token)
	return token as AtomToken<T>
}
