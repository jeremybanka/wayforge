import { doNothing } from "~/packages/anvl/src/function"
import { Join } from "~/packages/anvl/src/join"

import type {
	AtomToken,
	Logger,
	ReadonlySelectorToken,
	SelectorToken,
	TimelineToken,
	TransactionToken,
	ƒn,
} from "../.."
import type { Atom } from "../atom"
import type { OperationProgress } from "../operation"
import type { ReadonlySelector, Selector } from "../selector"
import { Subject } from "../subject"
import type { Timeline } from "../timeline"
import type { Transaction, TransactionStatus } from "../transaction"

export * from "./deposit"
export * from "./lookup"
export * from "./withdraw"

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
	atoms: Map<string, Atom<any>>
	atomsThatAreDefault: Set<string>
	readonlySelectors: Map<string, ReadonlySelector<any>>
	selectorAtoms: Join<null, `selectorKey`, `atomKey`>
	selectorGraph: Join<{ source: string }>
	selectors: Map<string, Selector<any>>
	timelineAtoms: Join<null, `timelineKey`, `atomKey`>
	timelines: Map<string, Timeline>
	transactions: Map<string, Transaction<any>>
	valueMap: Map<string, any>

	subject: {
		atomCreation: Subject<AtomToken<unknown>>
		selectorCreation: Subject<
			ReadonlySelectorToken<unknown> | SelectorToken<unknown>
		>
		transactionCreation: Subject<TransactionToken<ƒn>>
		timelineCreation: Subject<TimelineToken>
		operationStatus: Subject<OperationProgress>
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
	const created = {
		...(store ??
			(() => ({
				atomsThatAreDefault: new Set(),
				selectorAtoms: new Join({ relationType: `n:n` })
					.from(`selectorKey`)
					.to(`atomKey`),
				selectorGraph: new Join({ relationType: `n:n` }),
			}))()),

		valueMap: new Map(store?.valueMap),
		atoms: new Map(),
		readonlySelectors: new Map(),
		selectors: new Map(),
		transactions: new Map(),
		timelines: new Map(),

		timelineAtoms: new Join({ relationType: `1:n` })
			.from(`timelineKey`)
			.to(`atomKey`),

		subject: {
			atomCreation: new Subject(),
			selectorCreation: new Subject(),
			transactionCreation: new Subject(),
			timelineCreation: new Subject(),
			operationStatus: new Subject(),
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

	store?.atoms.forEach((atom) => {
		const copiedAtom = { ...atom, subject: new Subject() } satisfies Atom<any>
		created.atoms.set(atom.key, copiedAtom)
	})
	store?.readonlySelectors.forEach((selector) => {
		selector.install(created)
	})
	store?.selectors.forEach((selector) => {
		selector.install(created)
	})
	store?.transactions.forEach((tx) => {
		tx.install(created)
	})
	store?.timelines.forEach((timeline) => {
		timeline.install(created)
	})

	return created
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
