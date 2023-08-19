import type { Store } from "./store"
import { IMPLICIT } from "./store"
import { target } from "./transaction"
import type { StateToken } from ".."

export type OperationProgress =
	| {
			open: false
	  }
	| {
			open: true
			done: Set<string>
			prev: Map<string, any>
			time: number
			token: StateToken<any>
	  }

export const openOperation = (token: StateToken<any>, store: Store): void => {
	const core = target(store)
	if (core.operation.open) {
		store.config.logger?.error(
			`❌ failed to setState to "${token.key}" during a setState for "${core.operation.token.key}"`,
		)
		throw Symbol(`violation`)
	}
	core.operation = {
		open: true,
		done: new Set(),
		prev: new Map(store.valueMap),
		time: Date.now(),
		token,
	}
	store.config.logger?.info(
		`⭕ operation start from "${token.key}" in store "${store.config.name}"`,
	)
}
export const closeOperation = (store: Store): void => {
	const core = target(store)
	core.operation = { open: false }
	store.config.logger?.info(`🔴 operation done`)
	store.subject.operationStatus.next(core.operation)
}

export const isDone = (key: string, store: Store = IMPLICIT.STORE): boolean => {
	const core = target(store)
	if (!core.operation.open) {
		store.config.logger?.warn(
			`isDone called outside of an operation. This is probably a bug.`,
		)
		return true
	}
	return core.operation.done.has(key)
}
export const markDone = (key: string, store: Store = IMPLICIT.STORE): void => {
	const core = target(store)
	if (!core.operation.open) {
		store.config.logger?.warn(
			`markDone called outside of an operation. This is probably a bug.`,
		)
		return
	}
	core.operation.done.add(key)
}
