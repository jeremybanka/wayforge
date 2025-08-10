import type { MutableAtomToken, StateLifecycleEvent } from "atom.io"
import type { Canonical } from "atom.io/json"
import { parseJson } from "atom.io/json"

import type { MutableAtomFamily, RegularAtomFamily } from ".."
import { createRegularAtomFamily } from "../families"
import { type Store, withdraw } from "../store"
import { Tracker } from "./tracker"
import type { SignalFrom, Transceiver } from "./transceiver"

export class FamilyTracker<
	T extends Transceiver<any, any, any>,
	K extends Canonical,
> {
	private trackers: Map<K, Tracker<T>> = new Map()

	public readonly latestSignalAtoms: RegularAtomFamily<SignalFrom<T> | null, K>
	public readonly mutableAtoms: MutableAtomFamily<T, K>

	public constructor(mutableAtoms: MutableAtomFamily<T, K>, store: Store) {
		const latestSignalAtoms = createRegularAtomFamily<SignalFrom<T> | null, K>(
			store,
			{
				key: `*${mutableAtoms.key}`,
				default: null,
			},
			[`mutable`, `updates`],
		)
		this.latestSignalAtoms = withdraw(store, latestSignalAtoms)
		this.mutableAtoms = mutableAtoms
		const trackerFamilyWatchesForCreationAndDisposalEvents = (
			event: StateLifecycleEvent<MutableAtomToken<T>>,
		) => {
			const { type, token } = event
			if (token.family) {
				const key = parseJson(token.family.subKey)
				switch (type) {
					case `state_creation`:
						this.trackers.set(key, new Tracker<T>(token, store))
						break
					case `state_disposal`: {
						const tracker = this.trackers.get(key)
						if (tracker) {
							tracker[Symbol.dispose]()
							this.trackers.delete(key)
						}
					}
				}
			}
		}
		this.mutableAtoms.subject.subscribe(
			`store=${store.config.name}::tracker-atom-family`,
			trackerFamilyWatchesForCreationAndDisposalEvents,
		)
	}
}
