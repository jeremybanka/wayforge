import HAMT from "hamt_plus"

import { become } from "~/packages/anvl/src/function"

import type { Atom, Selector, Store } from "."
import {
	IMPLICIT,
	cacheValue,
	emitUpdate,
	evictCachedValue,
	getState__INTERNAL,
	isAtomDefault,
	isDone,
	markAtomAsNotDefault,
	markDone,
	stowUpdate,
	target,
} from "."

export const evictDownStream = <T>(
	state: Atom<T>,
	store: Store = IMPLICIT.STORE,
): void => {
	const core = target(store)
	const downstream = core.selectorAtoms.getRelations(state.key)
	const downstreamKeys = downstream.map(({ id }) => id)
	store.config.logger?.info(
		`   || ${downstreamKeys.length} downstream:`,
		downstreamKeys,
	)
	if (core.operation.open) {
		store.config.logger?.info(`   ||`, [...core.operation.done], `already done`)
	}
	downstream.forEach(({ id: stateKey }) => {
		if (isDone(stateKey, store)) {
			store.config.logger?.info(`   || ${stateKey} already done`)
			return
		}
		const state =
			HAMT.get(stateKey, core.selectors) ??
			HAMT.get(stateKey, core.readonlySelectors)
		if (!state) {
			store.config.logger?.info(
				`   || ${stateKey} is an atom, and can't be downstream`,
			)
			return
		}
		evictCachedValue(stateKey, store)
		store.config.logger?.info(`   xx evicted "${stateKey}"`)

		markDone(stateKey, store)
	})
}

export const setAtomState = <T>(
	atom: Atom<T>,
	next: T | ((oldValue: T) => T),
	store: Store = IMPLICIT.STORE,
): void => {
	const oldValue = getState__INTERNAL(atom, store)
	const newValue = become(next)(oldValue)
	store.config.logger?.info(`<< setting atom "${atom.key}" to`, newValue)
	cacheValue(atom.key, newValue, store)
	if (isAtomDefault(atom.key, store)) {
		markAtomAsNotDefault(atom.key, store)
	}
	markDone(atom.key, store)
	store.config.logger?.info(
		`   || evicting caches downstream from "${atom.key}"`,
	)
	evictDownStream(atom, store)
	const update = { oldValue, newValue }
	if (store.transactionStatus.phase !== `building`) {
		emitUpdate(atom, update, store)
	} else {
		stowUpdate(atom, update, store)
	}
}
export const setSelectorState = <T>(
	selector: Selector<T>,
	next: T | ((oldValue: T) => T),
	store: Store = IMPLICIT.STORE,
): void => {
	const oldValue = getState__INTERNAL(selector, store)
	const newValue = become(next)(oldValue)

	store.config.logger?.info(`<< setting selector "${selector.key}" to`, newValue)
	store.config.logger?.info(`   || propagating change made to "${selector.key}"`)

	selector.set(newValue)
}
export const setState__INTERNAL = <T>(
	state: Atom<T> | Selector<T>,
	value: T | ((oldValue: T) => T),
	store: Store = IMPLICIT.STORE,
): void => {
	if (`set` in state) {
		setSelectorState(state, value, store)
	} else {
		setAtomState(state, value, store)
	}
}
