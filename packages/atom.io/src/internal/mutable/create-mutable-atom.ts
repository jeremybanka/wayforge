import type {
	FamilyMetadata,
	MutableAtomOptions,
	MutableAtomToken,
	UpdateHandler,
} from "atom.io"
import type { Json } from "atom.io/json"
import { selectJson } from "atom.io/json"

import type { MutableAtom } from ".."
import { cacheValue, setIntoStore } from ".."
import { markAtomAsDefault } from "../atom"
import { newest } from "../lineage"
import { deposit, type Store } from "../store"
import { Subject } from "../subject"
import { subscribeToState } from "../subscribe"
import { Tracker } from "./tracker"
import type { Transceiver } from "./transceiver"

export function createMutableAtom<
	T extends Transceiver<any>,
	J extends Json.Serializable,
>(
	store: Store,
	options: MutableAtomOptions<T, J>,
	family: FamilyMetadata | undefined,
): MutableAtomToken<T, J> {
	store.logger.info(
		`🔨`,
		`atom`,
		options.key,
		`creating in store "${store.config.name}"`,
	)
	const target = newest(store)
	const { key, default: def } = options
	const existing = target.atoms.get(key)
	const type = `mutable_atom`
	if (existing && existing.type === type) {
		store.logger.error(
			`❌`,
			type,
			key,
			`Tried to create atom, but it already exists in the store.`,
		)
		return deposit(existing)
	}
	const subject = new Subject<{ newValue: T; oldValue: T }>()
	const newAtom: MutableAtom<T, J> = {
		...options,
		type,
		install: (s: Store) => {
			s.logger.info(`🛠️`, `atom`, key, `installing in store "${s.config.name}"`)
			return createMutableAtom(s, options, family)
		},
		subject,
	} as const
	if (family) {
		newAtom.family = family
	}
	const initialValue = def()
	target.atoms.set(newAtom.key, newAtom)
	markAtomAsDefault(store, key)
	cacheValue(target, key, initialValue, subject)
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

	new Tracker(token, store)
	if (!family) {
		selectJson(token, options, store)
	}

	return token
}
