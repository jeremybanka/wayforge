import type {
	disposeState,
	editRelations,
	findRelations,
	findState,
	getInternalRelations,
	getState,
	resetState,
	setState,
	TransactionToken,
} from "atom.io"

import { arbitrary } from "../arbitrary"
import { disposeFromStore, findInStore } from "../families"
import { getEnvironmentData } from "../get-environment-data"
import { getFromStore } from "../get-state"
import {
	editRelationsInStore,
	findRelationsInStore,
	getInternalRelationsFromStore,
} from "../join"
import { newest } from "../lineage"
import { getJsonToken } from "../mutable"
import { MapOverlay } from "../overlays/map-overlay"
import { resetInStore, setIntoStore } from "../set-state"
import type { Fn } from "../utility-types"
import { actUponStore } from "./act-upon-store"
import { getEpochNumberOfAction } from "./get-epoch-number"
import type { ChildStore, RootStore } from "./is-root-store"
import type { TransactionProgress } from "./transaction-meta-progress"

export const buildTransaction = (
	store: RootStore,
	token: TransactionToken<any>,
	params: any[],
	id: string,
): ChildStore => {
	const parent = newest(store)
	const childBase: Omit<ChildStore, `transactionMeta`> = {
		parent,
		child: null,
		on: parent.on,
		loggers: parent.loggers,
		logger: parent.logger,
		config: parent.config,
		atoms: new MapOverlay(parent.atoms),
		atomsThatAreDefault: new Set(parent.atomsThatAreDefault),
		families: new MapOverlay(parent.families),
		joins: new MapOverlay(parent.joins),
		operation: { open: false },
		readonlySelectors: new MapOverlay(parent.readonlySelectors),
		timelines: new MapOverlay(parent.timelines),
		timelineTopics: parent.timelineTopics.overlay(),
		trackers: new Map(),
		transactions: new MapOverlay(parent.transactions),
		selectorAtoms: parent.selectorAtoms.overlay(),
		selectorGraph: parent.selectorGraph.overlay(),
		writableSelectors: new MapOverlay(parent.writableSelectors),
		valueMap: new MapOverlay(parent.valueMap),
		defaults: parent.defaults,
		disposalTraces: store.disposalTraces.copy(),
		molecules: new MapOverlay(parent.molecules),
		moleculeGraph: parent.moleculeGraph.overlay(),
		moleculeData: parent.moleculeData.overlay(),
		keyRefsInJoins: parent.keyRefsInJoins.overlay(),
		miscResources: new MapOverlay(parent.miscResources),
	}
	const epoch = getEpochNumberOfAction(store, token.key)

	const transactionMeta: TransactionProgress<Fn> = {
		phase: `building`,
		update: {
			type: `transaction_outcome`,
			token,
			id,
			epoch: epoch === undefined ? Number.NaN : epoch + 1,
			timestamp: Date.now(),
			subEvents: [],
			params,
			output: undefined,
		},
		toolkit: {
			get: ((...ps: Parameters<typeof getState>) =>
				getFromStore(child, ...ps)) as typeof getState,
			set: ((...ps: Parameters<typeof setState>) => {
				setIntoStore(child, ...ps)
			}) as typeof setState,
			reset: ((...ps: Parameters<typeof resetState>) => {
				resetInStore(child, ...ps)
			}) as typeof resetState,
			run: (t, identifier = arbitrary()) => actUponStore(child, t, identifier),
			find: ((...ps: Parameters<typeof findState>) =>
				findInStore(store, ...ps)) as typeof findState,
			json: (t) => getJsonToken(child, t),
			dispose: ((...ps: Parameters<typeof disposeState>) => {
				disposeFromStore(child, ...ps)
			}) as typeof disposeState,
			env: () => getEnvironmentData(child),
			rel: {
				edit: ((...ps: Parameters<typeof editRelations>) => {
					editRelationsInStore(child, ...ps)
				}) as typeof editRelations,
				find: ((...ps: Parameters<typeof findRelations>) => {
					return findRelationsInStore(child, ...ps)
				}) as typeof findRelations,
				internal: ((...ps: Parameters<typeof getInternalRelations>) => {
					return getInternalRelationsFromStore(child, ...ps)
				}) as typeof getInternalRelations,
			},
		},
	}
	const child: ChildStore = Object.assign(childBase, {
		transactionMeta,
	})
	parent.child = child
	store.logger.info(
		`🛫`,
		`transaction`,
		token.key,
		`building with params:`,
		params,
	)
	return child
}
