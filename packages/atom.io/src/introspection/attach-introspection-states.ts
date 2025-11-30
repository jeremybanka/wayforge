import type {
	AtomToken,
	Loadable,
	ReadonlyPureSelectorFamilyToken,
	TimelineToken,
	TransactionOutcomeEvent,
	TransactionToken,
} from "atom.io"
import type { Fn, RootStore, Store, Timeline } from "atom.io/internal"

import { type AtomTokenIndex, attachAtomIndex } from "./attach-atom-index"
import type { SelectorTokenIndex } from "./attach-selector-index"
import { attachSelectorIndex } from "./attach-selector-index"
import { attachTimelineFamily } from "./attach-timeline-family"
import { attachTimelineIndex } from "./attach-timeline-index"
import { attachTransactionIndex } from "./attach-transaction-index"
import { attachTransactionLogs } from "./attach-transaction-logs"
import { attachTypeSelectors } from "./attach-type-selectors"

export type IntrospectionStates = {
	atomIndex: AtomToken<AtomTokenIndex>
	selectorIndex: AtomToken<SelectorTokenIndex>
	transactionIndex: AtomToken<TransactionToken<Fn>[]>
	transactionLogSelectors: ReadonlyPureSelectorFamilyToken<
		readonly TransactionOutcomeEvent<TransactionToken<Fn>>[],
		string
	>
	timelineIndex: AtomToken<TimelineToken<any>[]>
	timelineSelectors: ReadonlyPureSelectorFamilyToken<Timeline<any>, string>
	typeSelectors: ReadonlyPureSelectorFamilyToken<Loadable<string>, string>
}

export const attachIntrospectionStates = (
	store: RootStore,
): IntrospectionStates => {
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
