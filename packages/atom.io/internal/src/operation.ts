import type { WritableToken } from "atom.io"

import { newest } from "./lineage"
import type { Store } from "./store"
import { isChildStore } from "./transaction/is-root-store"

export type OperationProgress =
	| {
			open: false
	  }
	| {
			open: true
			done: Set<string>
			prev: Map<string, any>
			time: number
			token: WritableToken<any>
	  }

export const openOperation = (
	token: WritableToken<any>,
	store: Store,
): `rejection` | undefined => {
	if (store.operation.open) {
		store.logger.error(
			`❌`,
			token.type,
			token.key,
			`failed to setState during a setState for "${store.operation.token.key}"`,
		)
		return `rejection`
	}
	store.operation = {
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
			!isChildStore(store)
				? ``
				: ` ${store.transactionMeta.phase} "${store.transactionMeta.update.key}"`
		}`,
	)
}
export const closeOperation = (store: Store): void => {
	if (store.operation.open) {
		store.logger.info(
			`🔴`,
			store.operation.token.type,
			store.operation.token.key,
			`operation done in store "${store.config.name}"`,
		)
	}
	store.operation = { open: false }
	store.on.operationClose.next(store.operation)
}

export const isDone = (key: string, store: Store): boolean => {
	if (!store.operation.open) {
		store.logger.warn(
			`🐞`,
			`unknown`,
			key,
			`isDone called outside of an operation. This is probably a bug.`,
		)
		return true
	}
	return store.operation.done.has(key)
}
export const markDone = (key: string, store: Store): void => {
	if (!store.operation.open) {
		store.logger.warn(
			`🐞`,
			`unknown`,
			key,
			`markDone called outside of an operation. This is probably a bug.`,
		)
		return
	}
	store.operation.done.add(key)
}
