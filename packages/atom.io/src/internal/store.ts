import type { Hamt } from "hamt_plus"
import HAMT from "hamt_plus"

import { doNothing } from "~/packages/anvl/src/function"
import { Join } from "~/packages/anvl/src/join"

import type {
  Atom,
  OperationProgress,
  ReadonlySelector,
  Selector,
  TransactionStatus,
  Logger,
  Timeline,
  TimelineData,
} from "."
import type { Transaction, ƒn } from ".."

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
  atoms: Hamt<Atom<any>, string>
  atomsThatAreDefault: Set<string>
  readonlySelectors: Hamt<ReadonlySelector<any>, string>
  selectorAtoms: Join
  selectorGraph: Join<{ source: string }>
  selectors: Hamt<Selector<any>, string>
  timelines: Hamt<Timeline, string>
  timelineAtoms: Join
  timelineStore: Hamt<TimelineData, string>
  transactions: Hamt<Transaction<any>, string>
  valueMap: Hamt<any, string>

  operation: OperationProgress
  transactionStatus: TransactionStatus<ƒn>
  config: {
    name: string
    logger: Logger | null
    logger__INTERNAL: Logger
  }
}

export const createStore = (name: string): Store =>
  ({
    atoms: HAMT.make<Atom<any>, string>(),
    atomsThatAreDefault: new Set(),
    readonlySelectors: HAMT.make<ReadonlySelector<any>, string>(),
    selectorAtoms: new Join({ relationType: `n:n` }),
    selectorGraph: new Join({ relationType: `n:n` }),
    selectors: HAMT.make<Selector<any>, string>(),
    timelines: HAMT.make<Timeline, string>(),
    timelineAtoms: new Join({ relationType: `1:n` }),
    timelineStore: HAMT.make<TimelineData, string>(),
    transactions: HAMT.make<Transaction<any>, string>(),
    valueMap: HAMT.make<any, string>(),

    operation: {
      open: false,
    },
    transactionStatus: {
      phase: `idle`,
    },
    config: {
      name,
      logger: {
        ...console,
        info: doNothing,
      },
      logger__INTERNAL: console,
    },
  } satisfies Store)

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
