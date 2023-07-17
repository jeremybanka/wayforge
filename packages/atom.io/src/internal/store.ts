import type { ƒn } from "~/packages/anvl/src/function"
import { doNothing } from "~/packages/anvl/src/function"
import { Join } from "~/packages/anvl/src/join"
import { mapObject, recordToEntries } from "~/packages/anvl/src/object"

import { Subject } from "."
import type {
	Atom,
	OperationProgress,
	ReadonlySelector,
	Selector,
	TransactionStatus,
	Timeline,
	Transaction,
} from "."
import type {
	AtomToken,
	Logger,
	ReadonlySelectorToken,
	SelectorToken,
	TimelineToken,
	TransactionToken,
} from ".."

export type StoreCore = Pick<
	Store,
	| `atoms`
	| `atomsThatAreDefault`
	| `operation`
	| `readonlySelectors`
	| `selectorAtoms`
	| `selectorGraph`
	| `selectors`
	| `timelineAtoms`
	| `timelines`
	| `transactions`
	| `valueMap`
>

export interface Store {
	atoms: Record<string, Atom<any>>
	atomsThatAreDefault: Set<string>
	readonlySelectors: Record<string, ReadonlySelector<any>>
	selectorAtoms: Join<null, `selectorKey`, `atomKey`>
	selectorGraph: Join<{ source: string }>
	selectors: Record<string, Selector<any>>
	timelineAtoms: Join<null, `timelineKey`, `atomKey`>
	timelines: Record<string, Timeline>
	transactions: Record<string, Transaction<any>>
	valueMap: Record<string, any>

	subject: {
		atomCreation: Subject<AtomToken<unknown>>
		selectorCreation: Subject<
			ReadonlySelectorToken<unknown> | SelectorToken<unknown>
		>
		transactionCreation: Subject<TransactionToken<unknown>>
		timelineCreation: Subject<TimelineToken>
	}

	operation: OperationProgress
	transactionStatus: TransactionStatus<ƒn>
	config: {
		name: string
		logger: Logger | null
		logger__INTERNAL: Logger
	}
}

export const createStore = (name: string, store: Store | null = null): Store => {
	const copiedStore = {
		...(store ??
			(() => ({
				atomsThatAreDefault: new Set(),
				selectorAtoms: new Join({ relationType: `n:n` })
					.from(`selectorKey`)
					.to(`atomKey`),
				selectorGraph: new Join({ relationType: `n:n` }),
				valueMap: {},
			}))()),

		valueMap: { ...store?.valueMap },

		atoms: mapObject(store?.atoms ?? {}, (atom) => ({
			...atom,
			subject: new Subject(),
		})),
		readonlySelectors: {},
		selectors: {},
		transactions: {},
		timelines: {},

		timelineAtoms: new Join({ relationType: `1:n` })
			.from(`timelineKey`)
			.to(`atomKey`),

		subject: {
			atomCreation: new Subject(),
			selectorCreation: new Subject(),
			transactionCreation: new Subject(),
			timelineCreation: new Subject(),
			...store?.subject,
		},

		operation: {
			open: false,
			...store?.operation,
		},
		transactionStatus: {
			phase: `idle`,
			...store?.transactionStatus,
		},
		config: {
			logger: {
				...console,
				info: doNothing,
				...store?.config?.logger,
			},
			logger__INTERNAL: console,
			...store?.config,
			name,
		},
	} satisfies Store

	recordToEntries(store?.readonlySelectors ?? {}).forEach(([_, selector]) => {
		selector.install(copiedStore)
	})
	recordToEntries(store?.selectors ?? {}).forEach(([_, selector]) => {
		selector.install(copiedStore)
	})
	recordToEntries(store?.transactions ?? {}).forEach(([_, transaction]) => {
		transaction.install(copiedStore)
	})
	recordToEntries(store?.timelines ?? {}).forEach(([_, timeline]) => {
		timeline.install(copiedStore)
	})

	return copiedStore
}

export const IMPLICIT = {
	STORE_INTERNAL: undefined as Store | undefined,
	get STORE(): Store {
		return this.STORE_INTERNAL ?? (this.STORE_INTERNAL = createStore(`DEFAULT`))
	},
}

export const clearStore = (store: Store = IMPLICIT.STORE): void => {
	const { config } = store
	Object.assign(store, createStore(config.name))
	store.config = config
}
