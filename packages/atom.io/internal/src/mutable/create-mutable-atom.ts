import type { UpdateHandler } from "atom.io"
import type {
	FamilyMetadata,
	MutableAtomOptions,
	MutableAtomToken,
} from "atom.io"
import { setState } from "atom.io"
import type { Json } from "atom.io/json"
import { selectJson } from "atom.io/json"

import { type MutableAtom, cacheValue } from ".."
import { createRegularAtom, markAtomAsDefault } from "../atom"
import { newest } from "../lineage"
import { type Store, deposit } from "../store"
import { Subject } from "../subject"
import { subscribeToState } from "../subscribe"
import { Tracker } from "./tracker"
import type { Transceiver } from "./transceiver"

export function createMutableAtom<
	T extends Transceiver<any>,
	J extends Json.Serializable,
>(
	options: MutableAtomOptions<T, J>,
	family: FamilyMetadata | undefined,
	store: Store,
): MutableAtomToken<T, J> {
	store.logger.info(
		`🔨`,
		`atom`,
		options.key,
		`creating in store "${store.config.name}"`,
	)
	const target = newest(store)
	const existing = target.atoms.get(options.key)
	if (existing && existing.type === `mutable_atom`) {
		store.logger.error(
			`❌`,
			`atom`,
			options.key,
			`Tried to create atom, but it already exists in the store.`,
		)
		return deposit(existing)
	}
	const subject = new Subject<{ newValue: T; oldValue: T }>()
	const newAtom: MutableAtom<T, J> = {
		...options,
		type: `mutable_atom`,
		install: (store: Store) => {
			store.logger.info(
				`🛠️`,
				`atom`,
				options.key,
				`installing in store "${store.config.name}"`,
			)
			return createMutableAtom(options, family, store)
		},
		subject,
	} as const
	if (family) {
		newAtom.family = family
	}
	const initialValue = options.default()
	target.atoms.set(newAtom.key, newAtom)
	markAtomAsDefault(options.key, store)
	cacheValue(options.key, initialValue, subject, target)
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

	new Tracker(token, store)
	selectJson(token, options, store)

	store.on.atomCreation.next(token)

	return token
}
