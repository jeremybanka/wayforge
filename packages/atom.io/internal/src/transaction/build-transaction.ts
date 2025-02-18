import type { disposeState, getState, setState } from "atom.io"
import type { findState } from "atom.io/ephemeral"
import type { seekState } from "atom.io/immortal"

import { arbitrary } from "../arbitrary"
import { disposeFromStore, findInStore, seekInStore } from "../families"
import { getEnvironmentData } from "../get-environment-data"
import { getFromStore } from "../get-state"
import { Junction } from "../junction"
import { LazyMap } from "../lazy-map"
import { newest } from "../lineage"
import { getJsonToken } from "../mutable"
import { setIntoStore } from "../set-state"
import type { Store } from "../store"
import type { Func } from "../utility-types"
import type { TransactionProgress } from "."
import { actUponStore, getEpochNumberOfAction } from "."
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
		timelineTopics: new Junction(parent.timelineTopics.toJSON()),
		trackers: new Map(),
		transactions: new LazyMap(parent.transactions),
		selectorAtoms: new Junction(parent.selectorAtoms.toJSON()),
		selectorGraph: new Junction(parent.selectorGraph.toJSON(), {
			makeContentKey: (...keys) => keys.sort().join(`:`),
		}),
		selectors: new LazyMap(parent.selectors),
		valueMap: new LazyMap(parent.valueMap),
		defaults: parent.defaults,
		disposalTraces: store.disposalTraces.copy(),
		molecules: new LazyMap(parent.molecules),
		miscResources: new LazyMap(parent.miscResources),
	}
	const epoch = getEpochNumberOfAction(key, store)
	const transactionMeta: TransactionProgress<Func> = {
		phase: `building`,
		update: {
			type: `transaction_update`,
			key,
			id,
			epoch: epoch === undefined ? Number.NaN : epoch + 1,
			updates: [],
			params,
			output: undefined,
		},
		toolkit: {
			get: ((...ps: Parameters<typeof getState>) =>
				getFromStore(child, ...ps)) as typeof getState,
			set: ((...ps: Parameters<typeof setState>) => {
				setIntoStore(child, ...ps)
			}) as typeof setState,
			run: (token, identifier = arbitrary()) =>
				actUponStore(token, identifier, child),
			find: ((token, k) => findInStore(child, token, k)) as typeof findState,
			seek: ((token, k) => seekInStore(child, token, k)) as typeof seekState,
			json: (token) => getJsonToken(child, token),
			dispose: ((...ps: Parameters<typeof disposeState>) => {
				disposeFromStore(child, ...ps)
			}) as typeof disposeState,
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
