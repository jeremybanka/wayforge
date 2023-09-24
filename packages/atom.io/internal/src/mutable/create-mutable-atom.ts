import * as AtomIO from "atom.io"
import type { Json } from "atom.io/json"
import { selectJson } from "atom.io/json"

import { createAtom } from "../atom"
import type { Store } from "../store"
import { IMPLICIT } from "../store"
import { target } from "../transaction"
import { Tracker } from "./tracker"
import type { Transceiver } from "./transceiver"

export function createMutableAtom<
	Core extends Transceiver<any>,
	SerializableCore extends Json.Serializable,
>(
	options: AtomIO.MutableAtomOptions<Core, SerializableCore>,
	store: Store = IMPLICIT.STORE,
): AtomIO.MutableAtomToken<Core, SerializableCore> {
	store.config.logger?.info(
		`🔧 creating mutable atom "${options.key}" in store "${store.config.name}"`,
	)
	const coreState = createAtom<Core>(options, undefined, store)
	new Tracker(coreState, store)
	const jsonState = selectJson(coreState, options, store)
	AtomIO.subscribe(
		jsonState,
		() => {
			store.config.logger?.info(
				`🔍 tracker-initializer:${store?.config.name}:${
					store.transactionStatus.phase === `idle`
						? `main`
						: store.transactionStatus.key
				}`,
				`Initializing tracker for ${coreState.key}`,
			)

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
	return coreState as AtomIO.MutableAtomToken<Core, SerializableCore>
}
