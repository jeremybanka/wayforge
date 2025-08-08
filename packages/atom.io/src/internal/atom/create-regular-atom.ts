import type {
	FamilyMetadata,
	RegularAtomOptions,
	RegularAtomToken,
	UpdateHandler,
} from "atom.io"

import { type RegularAtom, resetInStore, setIntoStore } from ".."
import { newest } from "../lineage"
import type { Store } from "../store"
import { deposit } from "../store"
import { Subject } from "../subject"
import { subscribeToState } from "../subscribe"

export function createRegularAtom<T>(
	store: Store,
	options: RegularAtomOptions<T>,
	family: FamilyMetadata | undefined,
): RegularAtomToken<T> {
	const type = `atom`
	const { key } = options
	store.logger.info(
		`🔨`,
		`atom`,
		key,
		`creating in store "${store.config.name}"`,
	)
	const target = newest(store)
	const existing = target.atoms.get(key)
	if (existing && existing.type === type) {
		store.logger.error(
			`❌`,
			`atom`,
			key,
			`Tried to create atom, but it already exists in the store.`,
		)
		return deposit(existing)
	}
	const subject = new Subject<{ newValue: T; oldValue: T }>()
	const newAtom: RegularAtom<T> = {
		...options,
		type,
		install: (s: Store) => {
			s.logger.info(`🛠️`, type, key, `installing in store "${s.config.name}"`)
			return createRegularAtom(s, options, family)
		},
		subject,
	} as const
	if (family) {
		newAtom.family = family
	}
	// let initialValue = def
	// if (def instanceof Function) {
	// 	initialValue = def()
	// }
	target.atoms.set(key, newAtom)
	// cacheValue(target, key, initialValue, subject)
	const token = deposit(newAtom)
	if (options.effects) {
		let effectIndex = 0
		const cleanupFunctions: (() => void)[] = []
		for (const effect of options.effects) {
			const cleanup = effect({
				resetSelf: () => {
					resetInStore(store, token)
				},
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
	store.on.atomCreation.next(token)
	return token
}
