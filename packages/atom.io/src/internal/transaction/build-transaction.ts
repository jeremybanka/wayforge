import type { Store } from ".."

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
			atomsThatAreDefault: store.atomsThatAreDefault,
			operation: { open: false },
			readonlySelectors: new Map(store.readonlySelectors),
			timelines: new Map(store.timelines),
			timelineAtoms: store.timelineAtoms,
			transactions: new Map(store.transactions),
			selectorAtoms: store.selectorAtoms,
			selectorGraph: store.selectorGraph,
			selectors: new Map(store.selectors),
			valueMap: new Map(store.valueMap),
		},
		atomUpdates: [],
		params,
		output: undefined,
	}
	store.config.logger?.info(
		`🛫`,
		`transaction "${key}" started in store "${store.config.name}"`,
	)
}
