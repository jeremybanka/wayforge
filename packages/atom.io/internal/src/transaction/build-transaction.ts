import { Junction } from "rel8/junction"

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
	store.config.logger?.info(
		`🛫`,
		`transaction "${key}" building in store "${store.config.name}"`,
	)
}
