import type { StateToken } from "atom.io"

import type { Store } from "./store"
import { IMPLICIT } from "./store"
import { target } from "./transaction"

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

export const openOperation = (
	token: StateToken<any>,
	store: Store,
): `rejection` | undefined => {
	const core = target(store)
	if (core.operation.open) {
		store.logger.error(
			`❌`,
			token.type,
			token.key,
			`failed to setState during a setState for "${core.operation.token.key}"`,
		)
		return `rejection`
	}
	core.operation = {
		open: true,
		done: new Set(),
		prev: new Map(),
		time: Date.now(),
		token,
	}
	store.logger.info(
		`⭕`,
		token.type,
		token.key,
		`operation start in store "${store.config.name}"${
			store.transactionStatus.phase === `idle`
				? ``
				: ` ${store.transactionStatus.phase} "${store.transactionStatus.key}"`
		}`,
	)
}
export const closeOperation = (store: Store): void => {
	const core = target(store)
	if (core.operation.open) {
		store.logger.info(
			`🔴`,
			core.operation.token.type,
			core.operation.token.key,
			`operation done in store "${store.config.name}"`,
		)
	}
	core.operation = { open: false }
	store.subject.operationStatus.next(core.operation)
}

export const isDone = (key: string, store: Store = IMPLICIT.STORE): boolean => {
	const core = target(store)
	if (!core.operation.open) {
		store.logger.warn(
			`🐞`,
			`unknown`,
			key,
			`isDone called outside of an operation. This is probably a bug.`,
		)
		return true
	}
	return core.operation.done.has(key)
}
export const markDone = (key: string, store: Store = IMPLICIT.STORE): void => {
	const core = target(store)
	if (!core.operation.open) {
		store.logger.warn(
			`🐞`,
			`unknown`,
			key,
			`markDone called outside of an operation. This is probably a bug.`,
		)
		return
	}
	core.operation.done.add(key)
}
