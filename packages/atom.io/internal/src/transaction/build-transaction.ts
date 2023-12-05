import { Junction } from "~/packages/rel8/junction/src"

import { LazyMap } from "../lazy-map"
import type { Store } from "../store"

export const buildTransaction = (
	key: string,
	params: any[],
	store: Store,
): void => {
	store.transactionStatus = {
		key,
		phase: `building`,
		time: Date.now(),
		core: {
			atoms: new LazyMap(store.atoms),
			atomsThatAreDefault: new Set(store.atomsThatAreDefault),
			families: new LazyMap(store.families),
			operation: { open: false },
			readonlySelectors: new LazyMap(store.readonlySelectors),
			timelines: new LazyMap(store.timelines),
			timelineAtoms: new Junction(store.timelineAtoms.toJSON()),
			trackers: new Map(),
			transactions: new LazyMap(store.transactions),
			selectorAtoms: new Junction(store.selectorAtoms.toJSON()),
			selectorGraph: new Junction(store.selectorGraph.toJSON(), {
				makeContentKey: (...keys) => keys.sort().join(`:`),
			}),
			selectors: new LazyMap(store.selectors),
			valueMap: new LazyMap(store.valueMap),
		},
		atomUpdates: [],
		params,
		output: undefined,
	}
	store.logger.info(
		`🛫`,
		`transaction`,
		key,
		`Building transaction with params:`,
		params,
	)
}
