import { Junction } from "~/packages/rel8/junction/src"

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
			atoms: new Map(store.atoms),
			atomsThatAreDefault: new Set(store.atomsThatAreDefault),
			families: new Map(store.families),
			operation: { open: false },
			readonlySelectors: new Map(store.readonlySelectors),
			timelines: new Map(store.timelines),
			timelineAtoms: new Junction(store.timelineAtoms.toJSON()),
			trackers: new Map(),
			transactions: new Map(store.transactions),
			selectorAtoms: new Junction(store.selectorAtoms.toJSON()),
			selectorGraph: new Junction(store.selectorGraph.toJSON(), {
				makeContentKey: (...keys) => keys.sort().join(`:`),
			}),
			selectors: new Map(store.selectors),
			valueMap: new Map(store.valueMap),
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
