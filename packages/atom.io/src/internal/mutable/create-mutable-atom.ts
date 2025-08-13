import type {
	FamilyMetadata,
	MutableAtomOptions,
	MutableAtomToken,
	ReadableToken,
	UpdateHandler,
	WritableToken,
} from "atom.io"
import type { SetRTX } from "atom.io/transceivers/set-rtx"

import type { Atom, MutableAtom } from ".."
import { createStandaloneSelector, resetInStore, setIntoStore } from ".."
import { newest } from "../lineage"
import { deposit, type Store } from "../store"
import { Subject } from "../subject"
import { subscribeToState } from "../subscribe"
import { Tracker } from "./tracker"
import type { AsTransceiver, Transceiver } from "./transceiver"

// type A<T extends Transceiver<any, any, any>> = AsTransceiver<T>
// type B = A<Transceiver<string, string, string>> extends Transceiver<
// 	string,
// 	string,
// 	string
// >
// 	? true
// 	: false

export function createMutableAtom<T extends Transceiver<any, any, any>>(
	store: Store,
	options: MutableAtomOptions<T>,
	family: FamilyMetadata | undefined,
): MutableAtomToken<T> {
	store.logger.info(
		`🔨`,
		`atom`,
		options.key,
		`creating in store "${store.config.name}"`,
	)
	const target = newest(store)
	const { key } = options
	const existing = target.atoms.get(key) as Atom<T>
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
		newValue: T
		oldValue: T
	}>()
	const newAtom: MutableAtom<T> = {
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
					setIntoStore(store, token as WritableToken<T>, next)
				},
				onSet: (handle: UpdateHandler<T>) =>
					subscribeToState(
						store,
						token as ReadableToken<T>,
						`effect[${effectIndex}]`,
						handle,
					),
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
			get: ({ get }) => get(token as WritableToken<T>).toJSON(),
			set: ({ set }, newValue) => {
				set(token as WritableToken<T>, options.class.fromJSON(newValue))
			},
		})
	}
	store.on.atomCreation.next(token)
	return token
}
