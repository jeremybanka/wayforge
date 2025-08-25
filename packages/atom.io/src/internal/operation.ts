import type { AtomUpdateEvent, ReadableToken, StateCreationEvent } from "atom.io"

import type { Store } from "./store"
import { isChildStore } from "./transaction/is-root-store"

export type OperationProgress =
	| OpenOperation<any>
	| {
			open: false
	  }
export type OpenOperation<R extends ReadableToken<any> = ReadableToken<any>> = {
	open: true
	token: R
	done: Set<string>
	prev: Map<string, any>
	timestamp: number
	subEvents: (AtomUpdateEvent<any> | StateCreationEvent<any>)[]
}

export function openOperation(
	store: Store,
	token: ReadableToken<any>,
): number | (Store & { operation: OpenOperation }) {
	if (store.operation.open) {
		const rejectionTime = performance.now()
		store.logger.info(
			`🚫`,
			token.type,
			token.key,
			`deferring setState at T-${rejectionTime} until setState for "${store.operation.token.key}" is done`,
		)
		return rejectionTime
	}
	store.operation = {
		open: true,
		done: new Set(),
		prev: new Map(),
		timestamp: Date.now(),
		token,
		subEvents: [],
	}
	store.logger.info(
		`⭕`,
		token.type,
		token.key,
		`operation start in store "${store.config.name}"${
			isChildStore(store)
				? ` ${store.transactionMeta.phase} "${store.transactionMeta.update.token.key}"`
				: ``
		}`,
	)
	return store as Store & { operation: OpenOperation }
}

export function closeOperation(store: Store): void {
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

export const isDone = (store: Store, key: string): boolean => {
	if (!store.operation.open) {
		store.logger.error(
			`🐞`,
			`unknown`,
			key,
			`isDone called outside of an operation. This is probably a bug in AtomIO.`,
		)
		return true
	}
	return store.operation.done.has(key)
}
export const markDone = (store: Store, key: string): void => {
	if (!store.operation.open) {
		store.logger.error(
			`🐞`,
			`unknown`,
			key,
			`markDone called outside of an operation. This is probably a bug in AtomIO.`,
		)
		return
	}
	store.operation.done.add(key)
}
