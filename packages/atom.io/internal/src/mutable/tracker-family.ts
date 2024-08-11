import type { MutableAtomFamily, RegularAtomFamily } from "atom.io"
import type { Canonical } from "atom.io/json"
import { parseJson } from "atom.io/json"

import { createRegularAtomFamily, seekInStore } from "../families"
import type { Store } from "../store"
import { Tracker } from "./tracker"
import type { Transceiver } from "./transceiver"

export class FamilyTracker<
	Core extends Transceiver<any>,
	FamilyMemberKey extends Canonical,
> {
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
		this.latestUpdateAtoms = createRegularAtomFamily<
			typeof this.Update | null,
			FamilyMemberKey
		>(
			{
				key: `*${mutableAtoms.key}`,
				default: null,
			},
			store,
		)
		this.mutableAtoms = mutableAtoms
		this.mutableAtoms.subject.subscribe(
			`store=${store.config.name}::tracker-atom-family`,
			(event) => {
				if (event.token.family) {
					const key = parseJson(event.token.family.subKey) as FamilyMemberKey
					seekInStore(this.latestUpdateAtoms, key, store)
					new Tracker<Core>(event.token, store)
				}
			},
		)
		this.latestUpdateAtoms.subject.subscribe(
			`store=${store.config.name}::tracker-atom-family`,
			(event) => {
				if (event.token.family) {
					const key = parseJson(event.token.family.subKey) as FamilyMemberKey
					const mutableAtomToken = seekInStore(this.mutableAtoms, key, store)
					if (mutableAtomToken) {
						new Tracker<Core>(mutableAtomToken, store)
					}
				}
			},
		)
	}
}
