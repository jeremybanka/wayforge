import { __INTERNAL__ } from "atom.io"
import type {
	ReadonlySelectorFamily,
	ReadonlySelectorToken,
	TimelineToken,
	TransactionToken,
	TransactionUpdate,
	ƒn,
} from "atom.io"
import type { Timeline } from "atom.io/internal"

import { attachAtomIndex, type AtomTokenIndex } from "./attach-atom-index"
import type { SelectorTokenIndex } from "./attach-selector-index"
import { attachSelectorIndex } from "./attach-selector-index"
import { attachTimelineFamily } from "./attach-timeline-family"
import { attachTimelineIndex } from "./attach-timeline-index"
import { attachTransactionIndex } from "./attach-transaction-index"
import { attachTransactionLogs } from "./attach-transaction-logs"

export const attachIntrospectionStates = (
	store: __INTERNAL__.Store = __INTERNAL__.IMPLICIT.STORE,
): {
	atomIndex: ReadonlySelectorToken<AtomTokenIndex>
	selectorIndex: ReadonlySelectorToken<SelectorTokenIndex>
	transactionIndex: ReadonlySelectorToken<TransactionToken<ƒn>[]>
	findTransactionLogState: ReadonlySelectorFamily<TransactionUpdate<ƒn>[]>
	timelineIndex: ReadonlySelectorToken<TimelineToken[]>
	findTimelineState: ReadonlySelectorFamily<Timeline>
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
