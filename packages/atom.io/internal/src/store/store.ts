import type {
	AtomFamily,
	AtomToken,
	Logger,
	ReadonlySelectorFamily,
	ReadonlySelectorToken,
	SelectorFamily,
	SelectorToken,
	TimelineToken,
	TransactionToken,
	ƒn,
} from "atom.io"
import { isString } from "fp-ts/string"
import { Junction } from "rel8/junction"

import { doNothing } from "~/packages/anvl/src/function"
import { hasExactProperties } from "~/packages/anvl/src/object"

import type { Atom } from "../atom"
import type { OperationProgress } from "../operation"
import type { ReadonlySelector, Selector } from "../selector"
import { Subject } from "../subject"
import type { Timeline } from "../timeline"
import type { Transaction, TransactionStatus } from "../transaction"

export type StoreCore = Pick<
	Store,
	| `atoms`
	| `atomsThatAreDefault`
	| `families`
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

export class Store {
	public valueMap = new Map<string, any>()

	public atoms = new Map<string, Atom<any>>()
	public selectors = new Map<string, Selector<any>>()
	public readonlySelectors = new Map<string, ReadonlySelector<any>>()

	public families = new Map<
		string,
		| AtomFamily<any, any>
		| ReadonlySelectorFamily<any, any>
		| SelectorFamily<any, any>
	>()

	public timelines = new Map<string, Timeline>()
	public transactions = new Map<string, Transaction<ƒn>>()

	public atomsThatAreDefault = new Set<string>()

	public timelineAtoms = new Junction({
		between: [`timelineKey`, `atomKey`],
		cardinality: `1:n`,
	})
	public selectorAtoms = new Junction({
		between: [`selectorKey`, `atomKey`],
		cardinality: `n:n`,
	})
	public selectorGraph = new Junction(
		{
			between: [`upstreamSelectorKey`, `downstreamSelectorKey`],
			cardinality: `n:n`,
		},
		{
			isContent: hasExactProperties({ source: isString }),
			makeContentKey: (...keys) => keys.sort().join(`:`),
		},
	)

	public subject = {
		atomCreation: new Subject<AtomToken<unknown>>(),
		selectorCreation: new Subject<
			ReadonlySelectorToken<unknown> | SelectorToken<unknown>
		>(),
		transactionCreation: new Subject<TransactionToken<ƒn>>(),
		timelineCreation: new Subject<TimelineToken>(),
		operationStatus: new Subject<OperationProgress>(),
	}
	public operation: OperationProgress = { open: false }
	public transactionStatus: TransactionStatus<ƒn> = { phase: `idle` }

	public config: {
		name: string
		logger: Logger | null
		logger__INTERNAL: Logger
	} = {
		name: `DEFAULT`,
		logger: { ...console, info: doNothing },
		logger__INTERNAL: console,
	}

	public constructor(name: string, store: Store | null = null) {
		if (store !== null) {
			this.valueMap = new Map(store?.valueMap)

			this.operation = { ...store?.operation }
			this.transactionStatus = { ...store?.transactionStatus }
			this.config = {
				...store?.config,
				logger__INTERNAL: console,
				logger: {
					...console,
					info: doNothing,
					...store?.config?.logger,
				},
				name,
			}
		}

		store?.atoms.forEach((atom) => {
			const copiedAtom = { ...atom, subject: new Subject() } satisfies Atom<any>
			this.atoms.set(atom.key, copiedAtom)
		})
		store?.readonlySelectors.forEach((selector) => {
			selector.install(this)
		})
		store?.selectors.forEach((selector) => {
			selector.install(this)
		})
		store?.transactions.forEach((tx) => {
			tx.install(this)
		})
		store?.timelines.forEach((timeline) => {
			timeline.install(this)
		})
	}
}

export const IMPLICIT = {
	STORE_INTERNAL: undefined as Store | undefined,
	get STORE(): Store {
		return this.STORE_INTERNAL ?? (this.STORE_INTERNAL = new Store(`DEFAULT`))
	},
}

export const clearStore = (store: Store = IMPLICIT.STORE): void => {
	const { config } = store
	Object.assign(store, new Store(config.name))
	store.config = config
}
