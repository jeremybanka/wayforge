import { Junction } from "~/packages/rel8/junction/src"

import { getState, runTransaction, setState } from "~/packages/atom.io/src"
import { getEnvironmentData } from "../get-environment-data"
import { LazyMap } from "../lazy-map"
import { newest } from "../lineage"
import type { Store } from "../store"

export const buildTransaction = (
	key: string,
	params: any[],
	store: Store,
	id?: string,
): void => {
	const parent = newest(store)
	const child: Store = {
		parent,
		child: null,
		on: parent.on,
		loggers: parent.loggers,
		logger: parent.logger,
		config: parent.config,
		transactionMeta: null,
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
	child.transactionMeta = {
		phase: `building`,
		time: Date.now(),
		update: {
			key,
			id: id ?? Math.random().toString(36).slice(2),
			updates: [],
			params,
			output: undefined,
		},
		transactors: {
			get: (token) => getState(token, child),
			set: (token, value) => setState(token, value, child),
			run: (token) => runTransaction(token, child),
			env: () => getEnvironmentData(child),
		},
	}
	parent.child = child
	store.logger.info(
		`🛫`,
		`transaction`,
		key,
		`Building transaction with params:`,
		params,
	)
}
