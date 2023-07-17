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
			atoms: { ...store.atoms },
			atomsThatAreDefault: store.atomsThatAreDefault,
			operation: { open: false },
			readonlySelectors: { ...store.readonlySelectors },
			timelines: { ...store.timelines },
			timelineAtoms: store.timelineAtoms,
			transactions: { ...store.transactions },
			selectorAtoms: store.selectorAtoms,
			selectorGraph: store.selectorGraph,
			selectors: { ...store.selectors },
			valueMap: { ...store.valueMap },
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
