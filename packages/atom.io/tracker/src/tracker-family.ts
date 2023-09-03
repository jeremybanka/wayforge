import * as AtomIO from "atom.io"
import type { Json } from "atom.io/json"
import { parseJson } from "atom.io/json"

import { observeCore, updateCore } from "./tracker-effects"
import type { Transceiver } from "./tracker-transceiver"

export const trackerFamily = <
	Core extends Transceiver<any>,
	FamilyMemberKey extends Json.Serializable,
>(
	coreFamily: AtomIO.AtomFamily<Core, FamilyMemberKey>,
	store: AtomIO.__INTERNAL__.Store = AtomIO.__INTERNAL__.IMPLICIT.STORE,
): AtomIO.AtomFamily<
	(Core extends Transceiver<infer Signal> ? Signal : never) | null,
	FamilyMemberKey
> => {
	const trackerFamilyKey = `${coreFamily.key}:tracker`
	const trackerFamily = AtomIO.atomFamily<
		(Core extends Transceiver<infer Signal> ? Signal : never) | null,
		FamilyMemberKey
	>({
		key: trackerFamilyKey,
		default: null,
		effects: (key) => [
			observeCore(coreFamily(key), store),
			updateCore(trackerFamilyKey, coreFamily(key), store),
		],
	})
	coreFamily.subject.subscribe(
		`store=${store.config.name}::tracker-atom-family`,
		(atomToken) => {
			if (atomToken.family) {
				trackerFamily(parseJson(atomToken.family.subKey) as FamilyMemberKey)
			}
		},
	)
	return trackerFamily
}
