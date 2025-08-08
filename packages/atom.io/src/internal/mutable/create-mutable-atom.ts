import type {
	FamilyMetadata,
	MutableAtomOptions,
	MutableAtomToken,
	UpdateHandler,
} from "atom.io"
import type { Json } from "atom.io/json"

import type { MutableAtom } from ".."
import { createStandaloneSelector, resetInStore, setIntoStore } from ".."
import { newest } from "../lineage"
import { deposit, type Store } from "../store"
import { Subject } from "../subject"
import { subscribeToState } from "../subscribe"
import { Tracker } from "./tracker"
import type { Transceiver, TransceiverKit } from "./transceiver"

export function createMutableAtom<
	J extends Json.Serializable,
	C extends abstract new () => Transceiver<any, J>,
	K extends TransceiverKit<J, C>,
>(
	store: Store,
	options: MutableAtomOptions<J, C, K>,
	family: FamilyMetadata | undefined,
): MutableAtomToken<InstanceType<K>> {
	store.logger.info(
		`🔨`,
		`atom`,
		options.key,
		`creating in store "${store.config.name}"`,
	)
	const target = newest(store)
	const { key } = options
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
	const subject = new Subject<{
		newValue: InstanceType<K>
		oldValue: InstanceType<K>
	}>()
	const newAtom: MutableAtom<J, C, K> = {
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
	target.atoms.set(newAtom.key, newAtom)
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
				onSet: (handle: UpdateHandler<InstanceType<K>>) =>
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
		createStandaloneSelector(store, {
			key: `${key}:JSON`,
			get: ({ get }) => get(token).toJSON(),
			set: ({ set }, newValue) => {
				set(token, options.class.fromJSON(newValue))
			},
		})
	}
	store.on.atomCreation.next(token)
	return token
}
