import { Junction } from "~/packages/rel8/junction/src"

import { LazyMap } from "../lazy-map"
import { newest } from "../scion"
import type { Store } from "../store"

export const buildTransaction = (
	key: string,
	params: any[],
	store: Store,
): void => {
	const parent = newest(store)
	parent.child = {
		parent,
		child: null,
		subject: parent.subject,
		loggers: parent.loggers,
		logger: parent.logger,
		config: parent.config,
		transactionMeta: {
			phase: `building`,
			time: Date.now(),
			update: {
				key,
				updates: [],
				params,
				output: undefined,
			},
		},
		atoms: new LazyMap(parent.atoms),
		atomsThatAreDefault: new Set(parent.atomsThatAreDefault),
		families: new LazyMap(parent.families),
		operation: { open: false },
		readonlySelectors: new LazyMap(parent.readonlySelectors),
		timelines: new LazyMap(parent.timelines),
		timelineAtoms: new Junction(parent.timelineAtoms.toJSON()),
		trackers: new Map(),
		transactions: new LazyMap(parent.transactions),
		selectorAtoms: new Junction(parent.selectorAtoms.toJSON()),
		selectorGraph: new Junction(parent.selectorGraph.toJSON(), {
			makeContentKey: (...keys) => keys.sort().join(`:`),
		}),
		selectors: new LazyMap(parent.selectors),
		valueMap: new LazyMap(parent.valueMap),
	}
	store.logger.info(
		`🛫`,
		`transaction`,
		key,
		`Building transaction with params:`,
		params,
	)
}
