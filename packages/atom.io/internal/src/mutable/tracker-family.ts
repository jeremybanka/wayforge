import type { Canonical } from "atom.io/json"
import { parseJson } from "atom.io/json"

import type { MutableAtomFamily, RegularAtomFamily } from ".."
import { createRegularAtomFamily } from "../families"
import { type Store, withdraw } from "../store"
import { Tracker } from "./tracker"
import type { Transceiver } from "./transceiver"

export class FamilyTracker<
	Core extends Transceiver<any>,
	FamilyMemberKey extends Canonical,
> {
	private trackers: Map<FamilyMemberKey, Tracker<Core>> = new Map()
	private readonly Update: Core extends Transceiver<infer Signal>
		? Signal
		: never

	public readonly latestUpdateAtoms: RegularAtomFamily<
		typeof this.Update | null,
		FamilyMemberKey
	>
	public readonly mutableAtoms: MutableAtomFamily<Core, any, FamilyMemberKey>

	public constructor(
		mutableAtoms: MutableAtomFamily<Core, any, FamilyMemberKey>,
		store: Store,
	) {
		const updateAtoms = createRegularAtomFamily<
			typeof this.Update | null,
			FamilyMemberKey
		>(
			store,
			{
				key: `*${mutableAtoms.key}`,
				default: null,
			},
			[`mutable`, `updates`],
		)
		this.latestUpdateAtoms = withdraw(updateAtoms, store)
		this.mutableAtoms = mutableAtoms
		this.mutableAtoms.subject.subscribe(
			`store=${store.config.name}::tracker-atom-family`,
			(event) => {
				const { type, token } = event
				if (token.family) {
					const key = parseJson(token.family.subKey)
					switch (type) {
						case `state_creation`:
							this.trackers.set(key, new Tracker<Core>(token, store))
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
