import { __INTERNAL__ } from "atom.io"
import type {
	ReadonlySelectorFamily,
	ReadonlySelectorToken,
	TransactionToken,
	TransactionUpdate,
} from "atom.io"

import type { ƒn } from "~/packages/anvl/src/function"

import { attachAtomIndex, type AtomTokenIndex } from "./attach-atom-index"
import {
	attachSelectorIndex,
	type SelectorTokenIndex,
} from "./attach-selector-index"
import { attachTransactionIndex } from "./attach-transaction-index"
import { attachTransactionLogs } from "./attach-transaction-logs"

export const attachIntrospectionStates = (
	store: __INTERNAL__.Store = __INTERNAL__.IMPLICIT.STORE,
): {
	atomIndex: ReadonlySelectorToken<AtomTokenIndex>
	selectorIndex: ReadonlySelectorToken<SelectorTokenIndex>
	transactionIndex: ReadonlySelectorToken<TransactionToken<ƒn>[]>
	findTransactionLogState: ReadonlySelectorFamily<TransactionUpdate<ƒn>[]>
} => {
	return {
		atomIndex: attachAtomIndex(store),
		selectorIndex: attachSelectorIndex(store),
		transactionIndex: attachTransactionIndex(store),
		findTransactionLogState: attachTransactionLogs(store),
	}
}
