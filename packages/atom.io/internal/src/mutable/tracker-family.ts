import type { MutableAtomFamily, RegularAtomFamily } from "atom.io"
import { findState } from "atom.io/ephemeral"
import type { Json } from "atom.io/json"
import { parseJson } from "atom.io/json"

import { createRegularAtomFamily } from "../families"
import type { Store } from "../store"
import { Tracker } from "./tracker"
import type { Transceiver } from "./transceiver"

export class FamilyTracker<
	Core extends Transceiver<any>,
	FamilyMemberKey extends Json.Serializable,
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
			(atomToken) => {
				if (atomToken.family) {
					const key = parseJson(atomToken.family.subKey) as FamilyMemberKey
					findState(this.latestUpdateAtoms, key)
					new Tracker<Core>(atomToken, store)
				}
			},
		)
		this.latestUpdateAtoms.subject.subscribe(
			`store=${store.config.name}::tracker-atom-family`,
			(atomToken) => {
				if (atomToken.family) {
					const key = parseJson(atomToken.family.subKey) as FamilyMemberKey
					const mutableAtomToken = findState(this.mutableAtoms, key)
					new Tracker<Core>(mutableAtomToken, store)
				}
			},
		)
	}
}
