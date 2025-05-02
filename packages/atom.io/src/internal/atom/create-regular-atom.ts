import type {
	FamilyMetadata,
	RegularAtomOptions,
	RegularAtomToken,
	UpdateHandler,
} from "atom.io"

import { type RegularAtom, setIntoStore } from ".."
import { cacheValue } from "../caching"
import { newest } from "../lineage"
import type { Store } from "../store"
import { deposit } from "../store"
import { Subject } from "../subject"
import { subscribeToState } from "../subscribe"
import { markAtomAsDefault } from "./is-default"

export function createRegularAtom<T>(
	store: Store,
	options: RegularAtomOptions<T>,
	family: FamilyMetadata | undefined,
): RegularAtomToken<T> {
	store.logger.info(
		`🔨`,
		`atom`,
		options.key,
		`creating in store "${store.config.name}"`,
	)
	const target = newest(store)
	const existing = target.atoms.get(options.key)
	if (existing && existing.type === `atom`) {
		store.logger.error(
			`❌`,
			`atom`,
			options.key,
			`Tried to create atom, but it already exists in the store.`,
		)
		return deposit(existing)
	}
	const subject = new Subject<{ newValue: T; oldValue: T }>()
	const newAtom: RegularAtom<T> = {
		...options,
		type: `atom`,
		install: (s: Store) => {
			s.logger.info(
				`🛠️`,
				`atom`,
				options.key,
				`installing in store "${s.config.name}"`,
			)
			return createRegularAtom(s, options, family)
		},
		subject,
	} as const
	if (family) {
		newAtom.family = family
	}
	let initialValue = options.default
	if (options.default instanceof Function) {
		initialValue = options.default()
	}
	target.atoms.set(newAtom.key, newAtom)
	markAtomAsDefault(store, options.key)
	cacheValue(target, options.key, initialValue, subject)
	const token = deposit(newAtom)
	if (options.effects) {
		let effectIndex = 0
		const cleanupFunctions: (() => void)[] = []
		for (const effect of options.effects) {
			const cleanup = effect({
				setSelf: (next) => {
					setIntoStore(store, token, next)
				},
				onSet: (handle: UpdateHandler<T>) =>
					subscribeToState(store, token, `effect[${effectIndex}]`, handle),
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
	return token
}
