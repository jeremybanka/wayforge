import type { Atom, ReadonlySelector, Selector, Store } from "."
import {
	getState__INTERNAL,
	withdraw,
	recallState,
	traceAllSelectorAtoms,
} from "."
import type { StateUpdate } from ".."

export const prepareUpdate = <T>(
	state: Atom<T> | ReadonlySelector<T> | Selector<T>,
	store: Store,
): StateUpdate<T> => {
	const oldValue = recallState(state, store)
	const newValue = getState__INTERNAL(state, store)
	return { newValue, oldValue }
}

export const stowUpdate = <T>(
	state: Atom<T>,
	update: StateUpdate<T>,
	store: Store,
): void => {
	const { key } = state
	const { logger } = store.config
	if (store.transactionStatus.phase !== `building`) {
		store.config.logger?.warn(
			`stowUpdate called outside of a transaction. This is probably a bug.`,
		)
		return
	}
	store.transactionStatus.atomUpdates.push({ key, ...update })
	logger?.info(`📝 ${key} stowed (`, update.oldValue, `->`, update.newValue, `)`)
}

export const emitUpdate = <T>(
	state: Atom<T> | ReadonlySelector<T> | Selector<T>,
	update: StateUpdate<T>,
	store: Store,
): void => {
	const { key } = state
	const { logger } = store.config
	logger?.info(
		`📢 ${state.type} "${key}" went (`,
		update.oldValue,
		`->`,
		update.newValue,
		`)`,
	)
	state.subject.next(update)
}

export const subscribeToRootAtoms = <T>(
	state: ReadonlySelector<T> | Selector<T>,
	store: Store,
): { unsubscribe: () => void }[] | null => {
	const dependencySubscriptions =
		`default` in state
			? null
			: traceAllSelectorAtoms(state.key, store).map((atomToken) => {
					const atom = withdraw(atomToken, store)
					if (atom === null) {
						throw new Error(
							`Atom "${atomToken.key}", a dependency of selector "${state.key}", not found in store "${store.config.name}".`,
						)
					}
					return atom.subject.subscribe((atomChange) => {
						store.config.logger?.info(
							`📢 selector "${state.key}" saw root "${atomToken.key}" go (`,
							atomChange.oldValue,
							`->`,
							atomChange.newValue,
							`)`,
						)
						const oldValue = recallState(state, store)
						const newValue = getState__INTERNAL(state, store)
						store.config.logger?.info(`   <- ${state.key} became`, newValue)
						state.subject.next({ newValue, oldValue })
					})
			  })
	return dependencySubscriptions
}
