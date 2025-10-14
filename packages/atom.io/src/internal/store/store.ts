import type {
	AtomToken,
	Logger,
	MoleculeCreationEvent,
	MoleculeDisposalEvent,
	SelectorToken,
	TimelineToken,
	TransactionToken,
} from "atom.io"
import { AtomIOLogger } from "atom.io"
import type { Canonical, stringified } from "atom.io/json"

import type { Join } from "../join"
import { Junction } from "../junction"
import type { Lineage } from "../lineage"
import type { Molecule } from "../molecule"
import type { Tracker, Transceiver } from "../mutable"
import { getJsonToken, getUpdateToken } from "../mutable"
import type { OperationProgress } from "../operation"
import { isReservedIntrospectionKey } from "../reserved-keys"
import type {
	Atom,
	HeldSelectorFamily,
	MutableAtomFamily,
	PureSelectorFamily,
	ReadonlySelector,
	RegularAtomFamily,
	WritableSelector,
} from "../state-types"
import { StatefulSubject, Subject } from "../subject"
import type { Timeline } from "../timeline"
import type {
	ChildStore,
	RootStore,
	Transaction,
	TransactionEpoch,
	TransactionProgress,
} from "../transaction"
import { isRootStore } from "../transaction"
import type { Fn } from "../utility-types"
import { CircularBuffer } from "./circular-buffer"

export class Store implements Lineage {
	public parent: ChildStore | RootStore | null = null
	public child: ChildStore | null = null

	public valueMap: Map<string, any> = new Map()
	public defaults: Map<string, any> = new Map()

	public atoms: Map<string, Atom<any, any>> = new Map()
	public writableSelectors: Map<string, WritableSelector<any, any>> = new Map()
	public readonlySelectors: Map<string, ReadonlySelector<any, any>> = new Map()

	public atomsThatAreDefault: Set<string> = new Set()
	public selectorAtoms: Junction<`selectorKey`, string, `atomKey`, string> =
		new Junction({
			between: [`selectorKey`, `atomKey`],
			cardinality: `n:n`,
		})
	public selectorGraph: Junction<
		`upstreamSelectorKey`,
		string,
		`downstreamSelectorKey`,
		string,
		{ source: string }
	> = new Junction(
		{
			between: [`upstreamSelectorKey`, `downstreamSelectorKey`],
			cardinality: `n:n`,
		},
		{
			makeContentKey: (...keys) => keys.sort().join(`:`),
		},
	)
	public trackers: Map<string, Tracker<Transceiver<any, any, any>>> = new Map()
	public families: Map<
		string,
		| HeldSelectorFamily<any, any>
		| MutableAtomFamily<any, any>
		| PureSelectorFamily<any, any, any>
		| RegularAtomFamily<any, any, any>
	> = new Map()
	public joins: Map<string, Join<any, any, any, any, any>> = new Map()

	public transactions: Map<string, Transaction<Fn>> = new Map()
	public transactionMeta: TransactionEpoch | TransactionProgress<Fn> = {
		epoch: new Map<string, number>(),
		actionContinuities: new Junction({
			between: [`continuity`, `action`],
			cardinality: `1:n`,
		}),
	}

	public timelines: Map<string, Timeline<any>> = new Map()
	public timelineTopics: Junction<
		`timelineKey`,
		string,
		`topicKey`,
		string,
		{ topicType: `atom_family` | `atom` | `molecule_family` | `molecule` }
	> = new Junction({
		between: [`timelineKey`, `topicKey`],
		cardinality: `1:n`,
	})

	public disposalTraces: CircularBuffer<{ key: string; trace: string }> =
		new CircularBuffer(100)

	public molecules: Map<string, Molecule<Canonical>> = new Map()

	public moleculeGraph: Junction<
		`upstreamMoleculeKey`,
		stringified<Canonical> | `"root"`,
		`downstreamMoleculeKey`,
		stringified<Canonical>,
		{ source: stringified<Canonical> }
	> = new Junction(
		{
			between: [`upstreamMoleculeKey`, `downstreamMoleculeKey`],
			cardinality: `n:n`,
		},
		{
			makeContentKey: (...keys) => keys.sort().join(`:`),
		},
	)
	public moleculeData: Junction<
		`moleculeKey`,
		stringified<Canonical>,
		`stateFamilyKey`,
		string
	> = new Junction(
		{
			between: [`moleculeKey`, `stateFamilyKey`],
			cardinality: `n:n`,
		},
		{
			makeContentKey: (...keys) => keys.sort().join(`:`),
		},
	)
	public keyRefsInJoins: Junction<
		`moleculeKey`,
		stringified<Canonical>,
		`joinKey`,
		string
	> = new Junction(
		{
			between: [`moleculeKey`, `joinKey`],
			cardinality: `n:n`,
		},
		{
			makeContentKey: (...keys) => keys.sort().join(`:`),
		},
	)
	public miscResources: Map<string, Disposable> = new Map()

	public on: StoreEventCarrier = {
		atomCreation: new Subject(),
		atomDisposal: new Subject(),
		selectorCreation: new Subject(),
		selectorDisposal: new Subject(),
		timelineCreation: new Subject(),
		transactionCreation: new Subject(),
		transactionApplying: new StatefulSubject(null),
		operationClose: new Subject(),
		moleculeCreation: new Subject(),
		moleculeDisposal: new Subject(),
	}
	public operation: OperationProgress = { open: false }

	public config: {
		name: string
		lifespan: `ephemeral` | `immortal`
		isProduction: boolean
	} = {
		name: `IMPLICIT_STORE`,
		lifespan: `ephemeral`,
		isProduction: process?.env?.[`NODE_ENV`] === `production`,
	}

	public loggers: AtomIOLogger[] = [
		new AtomIOLogger(`warn`, (_, __, key) => !isReservedIntrospectionKey(key)),
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

	public constructor(config: Store[`config`], store: Store | null = null) {
		this.config = {
			...store?.config,
			...config,
		}
		if (store !== null) {
			this.operation = { ...store?.operation }
			if (isRootStore(store)) {
				this.transactionMeta = {
					epoch: new Map(store?.transactionMeta.epoch),
					actionContinuities: new Junction(
						store?.transactionMeta.actionContinuities.toJSON(),
					),
				}
			}

			for (const [, family] of store.families) {
				if (
					family.internalRoles?.includes(`mutable`) ||
					family.internalRoles?.includes(`join`)
				) {
					continue
				}
				family.install(this as RootStore)
			}
			const mutableHelpers = new Set<string>()
			for (const [, atom] of store.atoms) {
				if (mutableHelpers.has(atom.key)) {
					continue
				}
				atom.install(this as RootStore)
				if (atom.type === `mutable_atom`) {
					const originalJsonToken = getJsonToken(store, atom)
					const originalUpdateToken = getUpdateToken(atom)
					mutableHelpers.add(originalJsonToken.key)
					mutableHelpers.add(originalUpdateToken.key)
				}
			}
			for (const [, selector] of store.readonlySelectors) {
				selector.install(this as RootStore)
			}
			for (const [, selector] of store.writableSelectors) {
				if (mutableHelpers.has(selector.key)) {
					continue
				}
				selector.install(this as RootStore)
			}
			for (const [, tx] of store.transactions) {
				tx.install(this as RootStore)
			}
			for (const [, timeline] of store.timelines) {
				timeline.install(this as RootStore)
			}
		}
	}
}

export type StoreEventCarrier = {
	atomCreation: Subject<AtomToken<unknown, any, any>>
	atomDisposal: Subject<AtomToken<unknown, any, any>>
	selectorCreation: Subject<SelectorToken<unknown, any, any>>
	selectorDisposal: Subject<SelectorToken<unknown, any, any>>
	timelineCreation: Subject<TimelineToken<unknown>>
	transactionCreation: Subject<TransactionToken<Fn>>
	transactionApplying: StatefulSubject<TransactionProgress<Fn> | null>
	operationClose: Subject<OperationProgress>
	moleculeCreation: Subject<MoleculeCreationEvent>
	moleculeDisposal: Subject<MoleculeDisposalEvent>
}

declare global {
	var ATOM_IO_IMPLICIT_STORE: RootStore | undefined
}

export const IMPLICIT: { readonly STORE: RootStore } = {
	get STORE(): RootStore {
		globalThis.ATOM_IO_IMPLICIT_STORE ??= new Store({
			name: `IMPLICIT_STORE`,
			lifespan: `ephemeral`,
			isProduction: process?.env?.[`NODE_ENV`] === `production`,
		}) as RootStore
		return globalThis.ATOM_IO_IMPLICIT_STORE
	},
}

export const clearStore = (store: Store): void => {
	const { config } = store
	for (const disposable of store.miscResources.values()) {
		disposable[Symbol.dispose]()
	}
	Object.assign(store, new Store(config))
	store.config = config
}
