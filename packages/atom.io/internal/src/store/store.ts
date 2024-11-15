import type {
	AtomToken,
	Logger,
	MoleculeCreationModern,
	MoleculeDisposalModern,
	MoleculeFamily,
	MoleculeToken,
	ReadonlySelectorToken,
	TimelineToken,
	TransactionToken,
	WritableSelectorToken,
} from "atom.io"
import { AtomIOLogger } from "atom.io"

import type {
	Atom,
	MutableAtomFamily,
	ReadonlySelector,
	ReadonlySelectorFamily,
	RegularAtomFamily,
	WritableSelector,
	WritableSelectorFamily,
} from ".."
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

	public valueMap = new Map<string, any>()
	public defaults = new Map<string, any>()

	public atoms = new Map<string, Atom<any>>()
	public selectors = new Map<string, WritableSelector<any>>()
	public readonlySelectors = new Map<string, ReadonlySelector<any>>()

	public atomsThatAreDefault = new Set<string>()
	public selectorAtoms = new Junction({
		between: [`selectorKey`, `atomKey`],
		cardinality: `n:n`,
	})
	public selectorGraph = new Junction<
		`upstreamSelectorKey`,
		string,
		`downstreamSelectorKey`,
		string,
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
	public trackers = new Map<string, Tracker<Transceiver<any>>>()
	public families = new Map<
		string,
		| MutableAtomFamily<any, any, any>
		| ReadonlySelectorFamily<any, any>
		| RegularAtomFamily<any, any>
		| WritableSelectorFamily<any, any>
	>()

	public transactions = new Map<string, Transaction<Func>>()
	public transactionMeta: TransactionEpoch | TransactionProgress<Func> = {
		epoch: new Map<string, number>(),
		actionContinuities: new Junction({
			between: [`continuity`, `action`],
			cardinality: `1:n`,
		}),
	}

	public timelines = new Map<string, Timeline<any>>()
	public timelineTopics = new Junction<
		`timelineKey`,
		string,
		`topicKey`,
		string,
		{ topicType: `atom_family` | `atom` | `molecule_family` | `molecule` }
	>({
		between: [`timelineKey`, `topicKey`],
		cardinality: `1:n`,
	})

	public disposalTraces = new CircularBuffer<{ key: string; trace: string }>(100)

	public molecules = new Map<string, Molecule<any>>()
	public moleculeFamilies = new Map<string, MoleculeFamily<any>>()
	public moleculeInProgress: string | null = null
	public miscResources = new Map<string, Disposable>()

	public on = {
		atomCreation: new Subject<AtomToken<unknown>>(),
		atomDisposal: new Subject<AtomToken<unknown>>(),
		selectorCreation: new Subject<
			ReadonlySelectorToken<unknown> | WritableSelectorToken<unknown>
		>(),
		selectorDisposal: new Subject<
			ReadonlySelectorToken<unknown> | WritableSelectorToken<unknown>
		>(),
		timelineCreation: new Subject<TimelineToken<unknown>>(),
		transactionCreation: new Subject<TransactionToken<Func>>(),
		transactionApplying: new StatefulSubject<TransactionProgress<Func> | null>(
			null,
		),
		operationClose: new Subject<OperationProgress>(),
		moleculeCreationStart: new Subject<
			MoleculeCreationModern | MoleculeToken<any>
		>(),
		moleculeCreationDone: new Subject<MoleculeToken<any>>(),
		moleculeDisposal: new Subject<MoleculeDisposalModern | MoleculeToken<any>>(),
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
		new AtomIOLogger(`warn`, (_, __, key) => !key.includes(`🔍`)),
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
				if (family.internalRoles?.includes(`mutable`)) {
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

export const IMPLICIT = {
	get STORE(): Store {
		if (!globalThis.ATOM_IO_IMPLICIT_STORE) {
			globalThis.ATOM_IO_IMPLICIT_STORE = new Store({
				name: `IMPLICIT_STORE`,
				lifespan: `ephemeral`,
			})
		}
		return globalThis.ATOM_IO_IMPLICIT_STORE as Store
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
