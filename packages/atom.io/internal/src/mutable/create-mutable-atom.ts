import type { MutableAtomOptions, MutableAtomToken } from "atom.io"
import { subscribe } from "atom.io"
import type { Json } from "atom.io/json"
import { selectJson } from "atom.io/json"

import { createAtom } from "../atom"
import type { Store } from "../store"
import { target } from "../transaction"
import { Tracker } from "./tracker"
import type { Transceiver } from "./transceiver"

export function createMutableAtom<
	Core extends Transceiver<any>,
	SerializableCore extends Json.Serializable,
>(
	options: MutableAtomOptions<Core, SerializableCore>,
	store: Store,
): MutableAtomToken<Core, SerializableCore> {
	store.logger.info(
		`🔧`,
		`atom`,
		options.key,
		`creating in store "${store.config.name}"`,
	)
	const coreState = createAtom<Core>(options, undefined, store)
	new Tracker(coreState, store)
	const jsonState = selectJson(coreState, options, store)
	subscribe(
		jsonState,
		() => {
			const trackerHasBeenInitialized = target(store).trackers.has(coreState.key)
			if (!trackerHasBeenInitialized) {
				new Tracker(coreState, store)
			}
		},
		`tracker-initializer:${store?.config.name}:${
			store.transactionStatus.phase === `idle`
				? `main`
				: store.transactionStatus.key
		}`,
	)
	return coreState as MutableAtomToken<Core, SerializableCore>
}
