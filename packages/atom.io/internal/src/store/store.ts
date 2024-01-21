import { AtomIOLogger } from "atom.io"
import type {
	AtomToken,
	Logger,
	MutableAtomFamily,
	ReadonlySelectorFamily,
	ReadonlySelectorToken,
	RegularAtomFamily,
	TimelineToken,
	TransactionToken,
	WritableSelectorFamily,
	WritableSelectorToken,
	ƒn,
} from "atom.io"

import { Junction } from "~/packages/rel8/junction/src"

import type {
	Atom,
	ReadonlySelector,
	Tracker,
	Transceiver,
	WritableSelector,
} from ".."
import type { Lineage } from "../lineage"
import { getJsonToken, getUpdateToken } from "../mutable"
import type { OperationProgress } from "../operation"
import { StatefulSubject, Subject } from "../subject"
import type { Timeline } from "../timeline"
import type {
	Transaction,
	TransactionEpoch,
	TransactionProgress,
} from "../transaction"

export class Store implements Lineage {
	public parent: Store | null = null
	public child: Store | null = null

	public valueMap = new Map<string, any>()

	public atoms = new Map<string, Atom<any>>()
	public selectors = new Map<string, WritableSelector<any>>()
	public readonlySelectors = new Map<string, ReadonlySelector<any>>()

	public trackers = new Map<string, Tracker<Transceiver<any>>>()
	public families = new Map<
		string,
		| MutableAtomFamily<any, any, any>
		| ReadonlySelectorFamily<any, any>
		| RegularAtomFamily<any, any>
		| WritableSelectorFamily<any, any>
	>()

	public timelines = new Map<string, Timeline<any>>()
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
	public selectorGraph = new Junction<
		`upstreamSelectorKey`,
		`downstreamSelectorKey`,
		{ source: string }
	>(
		{
			between: [`upstreamSelectorKey`, `downstreamSelectorKey`],
			cardinality: `n:n`,
		},
		{
			makeContentKey: (...keys) => keys.sort().join(`:`),
		},
	)

	public on = {
		atomCreation: new Subject<AtomToken<unknown>>(),
		selectorCreation: new Subject<
			ReadonlySelectorToken<unknown> | WritableSelectorToken<unknown>
		>(),
		transactionCreation: new Subject<TransactionToken<ƒn>>(),
		timelineCreation: new Subject<TimelineToken<unknown>>(),
		transactionApplying: new StatefulSubject<TransactionProgress<ƒn> | null>(
			null,
		),
		operationClose: new Subject<OperationProgress>(),
	}
	public operation: OperationProgress = { open: false }
	public transactionMeta: TransactionEpoch | TransactionProgress<ƒn> = {
		epoch: -1,
	}

	public config: {
		name: string
	} = {
		name: `IMPLICIT_STORE`,
	}

	public loggers: AtomIOLogger[] = [
		new AtomIOLogger(`warn`, (_, __, key) => !key.includes(`👁‍🗨`)),
	]
	public logger: Logger = {
		error: (...messages) => {
			for (const logger of this.loggers) logger.error(...messages)
		},
		info: (...messages) => {
			for (const logger of this.loggers) logger.info(...messages)
		},
		warn: (...messages) => {
			for (const logger of this.loggers) logger.warn(...messages)
		},
	}

	public constructor(name: string, store: Store | null = null) {
		if (store !== null) {
			this.valueMap = new Map(store?.valueMap)
			this.operation = { ...store?.operation }
			this.transactionMeta = { ...store?.transactionMeta }

			this.config = {
				...store?.config,
				name,
			}
			for (const [, family] of store.families) {
				family.install(this)
			}
			const mutableHelpers = new Set<string>()
			for (const [, atom] of store.atoms) {
				if (mutableHelpers.has(atom.key)) {
					continue
				}
				atom.install(this)
				if (atom.type === `mutable_atom`) {
					const originalJsonToken = getJsonToken(atom)
					const originalUpdateToken = getUpdateToken(atom)
					mutableHelpers.add(originalJsonToken.key)
					mutableHelpers.add(originalUpdateToken.key)
				}
			}
			for (const [, selector] of store.readonlySelectors) {
				selector.install(this)
			}
			for (const [, selector] of store.selectors) {
				if (mutableHelpers.has(selector.key)) {
					continue
				}
				selector.install(this)
			}
			for (const [, tx] of store.transactions) {
				tx.install(this)
			}
			for (const [, timeline] of store.timelines) {
				timeline.install(this)
			}
		}
	}
}

export const IMPLICIT = {
	STORE_INTERNAL: undefined as Store | undefined,
	get STORE(): Store {
		return (
			this.STORE_INTERNAL ?? (this.STORE_INTERNAL = new Store(`IMPLICIT_STORE`))
		)
	},
}

export const clearStore = (store: Store): void => {
	const { config } = store
	Object.assign(store, new Store(config.name))
	store.config = config
}
