import type { Canonical } from "atom.io/json"
import { parseJson } from "atom.io/json"

import type { MutableAtomFamily, RegularAtomFamily } from ".."
import { createRegularAtomFamily } from "../families"
import { type Store, withdraw } from "../store"
import { Tracker } from "./tracker"
import type { Transceiver, TransceiverConstructor } from "./transceiver"

export class FamilyTracker<
	C extends TransceiverConstructor<any, any>,
	K extends Canonical,
> {
	private trackers: Map<K, Tracker<InstanceType<C>>> = new Map()

	public readonly latestUpdateAtoms: RegularAtomFamily<
		| (InstanceType<C> extends Transceiver<infer Signal, any> ? Signal : never)
		| null,
		K
	>
	public readonly mutableAtoms: MutableAtomFamily<C, K>

	public constructor(mutableAtoms: MutableAtomFamily<C, K>, store: Store) {
		const updateAtoms = createRegularAtomFamily<
			| (InstanceType<C> extends Transceiver<infer Signal, any> ? Signal : never)
			| null,
			K
		>(
			store,
			{
				key: `*${mutableAtoms.key}`,
				default: null,
			},
			[`mutable`, `updates`],
		)
		this.latestUpdateAtoms = withdraw(store, updateAtoms)
		this.mutableAtoms = mutableAtoms
		this.mutableAtoms.subject.subscribe(
			`store=${store.config.name}::tracker-atom-family`,
			(event) => {
				const { type, token } = event
				if (token.family) {
					const key = parseJson(token.family.subKey)
					switch (type) {
						case `state_creation`:
							this.trackers.set(key, new Tracker<InstanceType<C>>(token, store))
							break
						case `state_disposal`:
							{
								const tracker = this.trackers.get(key)
								if (tracker) {
									tracker[Symbol.dispose]()
									this.trackers.delete(key)
								}
							}
							break
					}
				}
			},
		)
	}
}
