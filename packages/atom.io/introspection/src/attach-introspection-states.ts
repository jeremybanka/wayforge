import type {
	ReadonlySelectorFamily,
	ReadonlySelectorToken,
	TimelineToken,
	TransactionToken,
	TransactionUpdate,
	ƒn,
} from "atom.io"
import * as Internal from "atom.io/internal"
import type { Timeline } from "atom.io/internal"

import { type AtomTokenIndex, attachAtomIndex } from "./attach-atom-index"
import type { SelectorTokenIndex } from "./attach-selector-index"
import { attachSelectorIndex } from "./attach-selector-index"
import { attachTimelineFamily } from "./attach-timeline-family"
import { attachTimelineIndex } from "./attach-timeline-index"
import { attachTransactionIndex } from "./attach-transaction-index"
import { attachTransactionLogs } from "./attach-transaction-logs"

export const attachIntrospectionStates = (
	store: Internal.Store = Internal.IMPLICIT.STORE,
): {
	atomIndex: ReadonlySelectorToken<AtomTokenIndex>
	selectorIndex: ReadonlySelectorToken<SelectorTokenIndex>
	transactionIndex: ReadonlySelectorToken<TransactionToken<ƒn>[]>
	findTransactionLogState: ReadonlySelectorFamily<TransactionUpdate<ƒn>[]>
	timelineIndex: ReadonlySelectorToken<TimelineToken<any>[]>
	findTimelineState: ReadonlySelectorFamily<Timeline<any>>
} => {
	return {
		atomIndex: attachAtomIndex(store),
		selectorIndex: attachSelectorIndex(store),
		transactionIndex: attachTransactionIndex(store),
		findTransactionLogState: attachTransactionLogs(store),
		timelineIndex: attachTimelineIndex(store),
		findTimelineState: attachTimelineFamily(store),
	}
}
