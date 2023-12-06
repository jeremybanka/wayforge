import type { StateToken } from "atom.io"

import { newest } from "./scion"
import type { Store } from "./store"

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
	const target = newest(store)
	if (target.operation.open) {
		store.logger.error(
			`❌`,
			token.type,
			token.key,
			`failed to setState during a setState for "${target.operation.token.key}"`,
		)
		return `rejection`
	}
	target.operation = {
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
			target.transactionMeta === null
				? ``
				: ` ${target.transactionMeta.phase} "${target.transactionMeta.update.key}"`
		}`,
	)
}
export const closeOperation = (store: Store): void => {
	const target = newest(store)
	if (target.operation.open) {
		store.logger.info(
			`🔴`,
			target.operation.token.type,
			target.operation.token.key,
			`operation done in store "${store.config.name}"`,
		)
	}
	target.operation = { open: false }
	store.subject.operationStatus.next(target.operation)
}

export const isDone = (key: string, store: Store): boolean => {
	const target = newest(store)
	if (!target.operation.open) {
		store.logger.warn(
			`🐞`,
			`unknown`,
			key,
			`isDone called outside of an operation. This is probably a bug.`,
		)
		return true
	}
	return target.operation.done.has(key)
}
export const markDone = (key: string, store: Store): void => {
	const target = newest(store)
	if (!target.operation.open) {
		store.logger.warn(
			`🐞`,
			`unknown`,
			key,
			`markDone called outside of an operation. This is probably a bug.`,
		)
		return
	}
	target.operation.done.add(key)
}
