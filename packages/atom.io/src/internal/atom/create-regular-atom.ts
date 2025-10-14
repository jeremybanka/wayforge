import type {
	FamilyMetadata,
	RegularAtomOptions,
	RegularAtomToken,
	UpdateHandler,
} from "atom.io"
import type { Canonical } from "atom.io/json"

import { eldest, newest } from "../lineage"
import { resetInStore, setIntoStore } from "../set-state"
import type { RegularAtom } from "../state-types"
import type { Store } from "../store"
import { deposit } from "../store"
import { Subject } from "../subject"
import { subscribeToState } from "../subscribe"
import type { RootStore } from "../transaction"
import type { InternalRole } from "./has-role"

export function createRegularAtom<T, K extends Canonical, E>(
	store: Store,
	options: RegularAtomOptions<T, E>,
	family: FamilyMetadata<K> | undefined,
	internalRoles?: InternalRole[],
): RegularAtomToken<T, K, E> {
	const type = `atom`
	const { key } = options
	store.logger.info(`🔨`, type, key, `is being created`)

	const target = newest(store)
	const existing = target.atoms.get(key)
	if (
		existing?.type === type &&
		store.config.warnings.has(`possible_duplicate_key`)
	) {
		store.logger.error(
			`❌`,
			`atom`,
			key,
			`Tried to create atom, but it already exists in the store.`,
		)
		return deposit(existing) as RegularAtomToken<T, K, E>
	}
	const subject = new Subject<{ newValue: T; oldValue: T }>()
	const newAtom: RegularAtom<T, E> = {
		...options,
		type,
		install: (s: RootStore) => {
			s.logger.info(`🛠️`, type, key, `installing in store "${s.config.name}"`)
			return createRegularAtom(s, options, family)
		},
		subject,
	} as const
	if (family) {
		newAtom.family = family
	}
	if (internalRoles) {
		newAtom.internalRoles = internalRoles
	}
	target.atoms.set(key, newAtom)
	const token = deposit(newAtom) as RegularAtomToken<T, K, E>
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
				token: token as any,
				store: eldest(store),
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
