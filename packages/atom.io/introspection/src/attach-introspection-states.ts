import type {
	ReadonlySelectorFamilyToken,
	ReadonlySelectorToken,
	TimelineToken,
	TransactionToken,
	TransactionUpdate,
} from "atom.io"
import type { Func, Timeline } from "atom.io/internal"
import * as Internal from "atom.io/internal"

import { type AtomTokenIndex, attachAtomIndex } from "./attach-atom-index"
import type { SelectorTokenIndex } from "./attach-selector-index"
import { attachSelectorIndex } from "./attach-selector-index"
import { attachTimelineFamily } from "./attach-timeline-family"
import { attachTimelineIndex } from "./attach-timeline-index"
import { attachTransactionIndex } from "./attach-transaction-index"
import { attachTransactionLogs } from "./attach-transaction-logs"
import { attachTypeSelectors } from "./attach-type-selectors"

export const attachIntrospectionStates = (
	store: Internal.Store = Internal.IMPLICIT.STORE,
): {
	atomIndex: ReadonlySelectorToken<AtomTokenIndex>
	selectorIndex: ReadonlySelectorToken<SelectorTokenIndex>
	transactionIndex: ReadonlySelectorToken<TransactionToken<Func>[]>
	transactionLogSelectors: ReadonlySelectorFamilyToken<
		TransactionUpdate<Func>[],
		string
	>
	timelineIndex: ReadonlySelectorToken<TimelineToken<any>[]>
	timelineSelectors: ReadonlySelectorFamilyToken<Timeline<any>, string>
	typeSelectors: ReadonlySelectorFamilyToken<string, string>
} => {
	return {
		atomIndex: attachAtomIndex(store),
		selectorIndex: attachSelectorIndex(store),
		transactionIndex: attachTransactionIndex(store),
		transactionLogSelectors: attachTransactionLogs(store),
		timelineIndex: attachTimelineIndex(store),
		timelineSelectors: attachTimelineFamily(store),
		typeSelectors: attachTypeSelectors(store),
	}
}
