import type {
	AtomToken,
	Logger,
	MoleculeCreation,
	MoleculeDisposal,
	ReadonlySelectorToken,
	TimelineToken,
	TransactionToken,
	WritableSelectorToken,
} from "atom.io"
import { AtomIOLogger } from "atom.io"
import type { Canonical, stringified } from "atom.io/json"

import type {
	Atom,
	MutableAtomFamily,
	ReadonlySelector,
	ReadonlySelectorFamily,
	RegularAtomFamily,
	WritableSelector,
	WritableSelectorFamily,
} from ".."
import { isReservedIntrospectionKey } from ".."
import type { Join } from "../join"
import { Junction } from "../junction"
import type { Lineage } from "../lineage"
import type { Molecule } from "../molecule"
import type { Tracker, Transceiver } from "../mutable"
import { getJsonToken, getUpdateToken } from "../mutable"
import type { OperationProgress } from "../operation"
import { StatefulSubject, Subject } from "../subject"
import type { Timeline } from "../timeline"
import type {
	Transaction,
	TransactionEpoch,
	TransactionProgress,
} from "../transaction"
import { isRootStore } from "../transaction"
import type { Func } from "../utility-types"
import { CircularBuffer } from "./circular-buffer"

export class Store implements Lineage {
	public parent: Store | null = null
	public child: Store | null = null

	public valueMap: Map<string, any> = new Map()
	public defaults: Map<string, any> = new Map()

	public atoms: Map<string, Atom<any>> = new Map()
	public selectors: Map<string, WritableSelector<any>> = new Map()
	public readonlySelectors: Map<string, ReadonlySelector<any>> = new Map()

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
	public trackers: Map<string, Tracker<Transceiver<any>>> = new Map()
	public families: Map<
		string,
		| MutableAtomFamily<any, any, any>
		| ReadonlySelectorFamily<any, any>
		| RegularAtomFamily<any, any>
		| WritableSelectorFamily<any, any>
	> = new Map()
	public joins: Map<string, Join<any, any, any, any, any, any>> = new Map()

	public transactions: Map<string, Transaction<Func>> = new Map()
	public transactionMeta: TransactionEpoch | TransactionProgress<Func> = {
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
	public moleculeJoins: Junction<
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
	public moleculeGraph: Junction<
		`upstreamMoleculeKey`,
		stringified<Canonical> | `root`,
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
	} = {
		name: `IMPLICIT_STORE`,
		lifespan: `ephemeral`,
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
			this.valueMap = new Map(store?.valueMap)
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
				family.install(this)
			}
			const mutableHelpers = new Set<string>()
			for (const [, atom] of store.atoms) {
				if (mutableHelpers.has(atom.key)) {
					continue
				}
				atom.install(this)
				if (atom.type === `mutable_atom`) {
					const originalJsonToken = getJsonToken(store, atom)
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

export type StoreEventCarrier = {
	atomCreation: Subject<AtomToken<unknown>>
	atomDisposal: Subject<AtomToken<unknown>>
	selectorCreation: Subject<
		ReadonlySelectorToken<unknown> | WritableSelectorToken<unknown>
	>
	selectorDisposal: Subject<
		ReadonlySelectorToken<unknown> | WritableSelectorToken<unknown>
	>
	timelineCreation: Subject<TimelineToken<unknown>>
	transactionCreation: Subject<TransactionToken<Func>>
	transactionApplying: StatefulSubject<TransactionProgress<Func> | null>
	operationClose: Subject<OperationProgress>
	moleculeCreation: Subject<MoleculeCreation>
	moleculeDisposal: Subject<MoleculeDisposal>
}

declare global {
	var ATOM_IO_IMPLICIT_STORE: Store | undefined
}

export const IMPLICIT: { readonly STORE: Store } = {
	get STORE(): Store {
		globalThis.ATOM_IO_IMPLICIT_STORE ??= new Store({
			name: `IMPLICIT_STORE`,
			lifespan: `ephemeral`,
		})
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
