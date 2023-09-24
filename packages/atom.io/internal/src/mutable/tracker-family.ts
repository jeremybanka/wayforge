import * as AtomIO from "atom.io"
import { type Json, parseJson } from "atom.io/json"

import { createAtomFamily } from "../families"
import { Tracker } from "./tracker"
import type { Transceiver } from "./transceiver"

export class FamilyTracker<
	Core extends Transceiver<any>,
	FamilyMemberKey extends Json.Serializable,
> {
	private readonly Update: Core extends Transceiver<infer Signal>
		? Signal
		: never

	public readonly findLatestUpdateState: AtomIO.AtomFamily<
		typeof this.Update | null,
		FamilyMemberKey
	>
	public readonly findMutableState: AtomIO.AtomFamily<Core, FamilyMemberKey>

	public constructor(
		findMutableState: AtomIO.AtomFamily<Core, FamilyMemberKey>,
		store: AtomIO.__INTERNAL__.Store = AtomIO.__INTERNAL__.IMPLICIT.STORE,
	) {
		this.findLatestUpdateState = createAtomFamily<
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
