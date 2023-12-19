import type { AtomFamily } from "atom.io"
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

	public readonly findLatestUpdateState: AtomFamily<
		typeof this.Update | null,
		FamilyMemberKey
	>
	public readonly findMutableState: AtomFamily<Core, FamilyMemberKey>

	public constructor(
		findMutableState: AtomFamily<Core, FamilyMemberKey>,
		store: Store,
	) {
		this.findLatestUpdateState = createRegularAtomFamily<
			typeof this.Update | null,
			FamilyMemberKey
		>(
			{
				key: `*${findMutableState.key}`,
				default: null,
			},
			store,
		)
		this.findMutableState = findMutableState
		this.findMutableState.subject.subscribe(
			`store=${store.config.name}::tracker-atom-family`,
			(atomToken) => {
				if (atomToken.family) {
					const key = parseJson(atomToken.family.subKey) as FamilyMemberKey
					this.findLatestUpdateState(key)
					new Tracker<Core>(atomToken, store)
				}
			},
		)
		this.findLatestUpdateState.subject.subscribe(
			`store=${store.config.name}::tracker-atom-family`,
			(atomToken) => {
				if (atomToken.family) {
					const key = parseJson(atomToken.family.subKey) as FamilyMemberKey
					const mutableAtomToken = this.findMutableState(key)
					new Tracker<Core>(mutableAtomToken, store)
				}
			},
		)
	}
}
