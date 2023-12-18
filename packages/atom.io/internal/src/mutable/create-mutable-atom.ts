import type {
	FamilyMetadata,
	MutableAtomOptions,
	MutableAtomToken,
} from "atom.io"
import type { Json } from "atom.io/json"
import { selectJson } from "atom.io/json"

import { createRegularAtom } from "../atom"
import { newest } from "../lineage"
import type { Store } from "../store"
import { subscribeToState } from "../subscribe"
import { Tracker } from "./tracker"
import type { Transceiver } from "./transceiver"

export function createMutableAtom<
	Core extends Transceiver<any>,
	SerializableCore extends Json.Serializable,
>(
	options: MutableAtomOptions<Core, SerializableCore>,
	family: FamilyMetadata | undefined,
	store: Store,
): MutableAtomToken<Core, SerializableCore> {
	store.logger.info(
		`🔧`,
		`atom`,
		options.key,
		`creating in store "${store.config.name}"`,
	)
	const coreState = createRegularAtom<Core>(options, family, store)
	new Tracker(coreState, store)
	const jsonState = selectJson(coreState, options, store)
	const target = newest(store)
	subscribeToState(
		jsonState,
		() => {
			const trackerHasBeenInitialized = newest(store).trackers.has(coreState.key)
			if (!trackerHasBeenInitialized) {
				new Tracker(coreState, store)
			}
		},
		`tracker-initializer:${store?.config.name}:${
			target.transactionMeta === null
				? `main`
				: `${target.transactionMeta.update.key}`
		}`,
		store,
	)
	return coreState as MutableAtomToken<Core, SerializableCore>
}
