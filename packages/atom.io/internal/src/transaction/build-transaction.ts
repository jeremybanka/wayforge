import type { findState, ƒn } from "atom.io"

import { Junction } from "~/packages/rel8/junction/src"

import type { TransactionProgress } from "."
import { actUponStore, getEpochNumber } from "."
import { arbitrary } from "../arbitrary"
import { findInStore } from "../families"
import { getEnvironmentData } from "../get-environment-data"
import { getFromStore } from "../get-state"
import { LazyMap } from "../lazy-map"
import { newest } from "../lineage"
import { setIntoStore } from "../set-state"
import type { Store } from "../store"
import type { ChildStore, RootStore } from "./is-root-store"

export const buildTransaction = (
	key: string,
	params: any[],
	store: Store,
	id: string,
): ChildStore => {
	const parent = newest(store) as ChildStore | RootStore
	const childBase: Omit<ChildStore, `transactionMeta`> = {
		parent,
		child: null,
		on: parent.on,
		loggers: parent.loggers,
		logger: parent.logger,
		config: parent.config,
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
	const epoch = getEpochNumber(key, store)
	const transactionMeta: TransactionProgress<ƒn> = {
		phase: `building` as const,
		update: {
			key,
			id,
			epoch: epoch ? epoch + 1 : NaN,
			updates: [],
			params,
			output: undefined,
		},
		transactors: {
			get: (token) => getFromStore(token, child),
			set: (token, value) => setIntoStore(token, value, child),
			run: (token, id = arbitrary()) => actUponStore(token, id, child),
			find: ((token, key) => findInStore(token, key, child)) as typeof findState,
			env: () => getEnvironmentData(child),
		},
	}
	const child: ChildStore = Object.assign(childBase, {
		transactionMeta,
	})
	parent.child = child
	store.logger.info(
		`🛫`,
		`transaction`,
		key,
		`Building transaction with params:`,
		params,
	)
	return child
}
