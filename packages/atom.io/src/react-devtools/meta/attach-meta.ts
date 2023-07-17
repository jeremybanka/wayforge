import type { ƒn } from "~/packages/anvl/src/function"

import type { AtomTokenIndex, SelectorTokenIndex } from "./meta-state"
import { attachMetaAtoms, attachMetaSelectors } from "./meta-state"
import {
	attachMetaTransactionUpdateLog,
	attachMetaTransactions,
} from "./meta-transactions"
import type {
	ReadonlySelectorFamily,
	ReadonlySelectorToken,
	TransactionToken,
	TransactionUpdate,
} from "../.."
import type { Store } from "../../internal/store"
import { IMPLICIT } from "../../internal/store"

export const attachMetaState = (
	store: Store = IMPLICIT.STORE,
): {
	atomTokenIndexState: ReadonlySelectorToken<AtomTokenIndex>
	selectorTokenIndexState: ReadonlySelectorToken<SelectorTokenIndex>
	transactionTokenIndexState: ReadonlySelectorToken<TransactionToken<unknown>[]>
	findTransactionUpdateLogState: ReadonlySelectorFamily<TransactionUpdate<ƒn>[]>
} => {
	return {
		atomTokenIndexState: attachMetaAtoms(store),
		selectorTokenIndexState: attachMetaSelectors(store),
		transactionTokenIndexState: attachMetaTransactions(store),
		findTransactionUpdateLogState: attachMetaTransactionUpdateLog(store),
	}
}
