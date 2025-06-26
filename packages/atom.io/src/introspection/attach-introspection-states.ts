import type {
	Loadable,
	ReadonlyPureSelectorFamilyToken,
	ReadonlyPureSelectorToken,
	TimelineToken,
	TransactionToken,
	TransactionUpdate,
} from "atom.io"
import type { Func, Store, Timeline } from "atom.io/internal"

import { type AtomTokenIndex, attachAtomIndex } from "./attach-atom-index"
import type { SelectorTokenIndex } from "./attach-selector-index"
import { attachSelectorIndex } from "./attach-selector-index"
import { attachTimelineFamily } from "./attach-timeline-family"
import { attachTimelineIndex } from "./attach-timeline-index"
import { attachTransactionIndex } from "./attach-transaction-index"
import { attachTransactionLogs } from "./attach-transaction-logs"
import { attachTypeSelectors } from "./attach-type-selectors"

export type IntrospectionStates = {
	atomIndex: ReadonlyPureSelectorToken<AtomTokenIndex>
	selectorIndex: ReadonlyPureSelectorToken<SelectorTokenIndex>
	transactionIndex: ReadonlyPureSelectorToken<TransactionToken<Func>[]>
	transactionLogSelectors: ReadonlyPureSelectorFamilyToken<
		TransactionUpdate<Func>[],
		string
	>
	timelineIndex: ReadonlyPureSelectorToken<TimelineToken<any>[]>
	timelineSelectors: ReadonlyPureSelectorFamilyToken<Timeline<any>, string>
	typeSelectors: ReadonlyPureSelectorFamilyToken<Loadable<string>, string>
}

export const attachIntrospectionStates = (store: Store): IntrospectionStates => {
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
