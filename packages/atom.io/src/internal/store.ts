import type { Hamt } from "hamt_plus"
import HAMT from "hamt_plus"
import * as Rx from "rxjs"

import type { ƒn } from "~/packages/anvl/src/function"
import { doNothing } from "~/packages/anvl/src/function"
import { Join } from "~/packages/anvl/src/join"

import type {
  Atom,
  OperationProgress,
  ReadonlySelector,
  Selector,
  TransactionStatus,
  Timeline,
  TimelineData,
} from "."
import type {
  AtomToken,
  Logger,
  ReadonlySelectorToken,
  SelectorToken,
  TimelineToken,
  Transaction,
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
  atoms: Hamt<Atom<any>, string>
  atomsThatAreDefault: Set<string>
  readonlySelectors: Hamt<ReadonlySelector<any>, string>
  selectorAtoms: Join<null, `selectorKey`, `atomKey`>
  selectorGraph: Join<{ source: string }>
  selectors: Hamt<Selector<any>, string>
  timelines: Hamt<Timeline, string>
  timelineAtoms: Join<null, `timelineKey`, `atomKey`>
  timelineStore: Hamt<TimelineData, string>
  transactions: Hamt<Transaction<any>, string>
  valueMap: Hamt<any, string>

  subject: {
    atomCreation: Rx.Subject<AtomToken<unknown>>
    selectorCreation: Rx.Subject<
      ReadonlySelectorToken<unknown> | SelectorToken<unknown>
    >
    transactionCreation: Rx.Subject<TransactionToken<unknown>>
    timelineCreation: Rx.Subject<TimelineToken>
  }

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
    selectorAtoms: new Join({ relationType: `n:n` })
      .from(`selectorKey`)
      .to(`atomKey`),
    selectorGraph: new Join({ relationType: `n:n` }),
    selectors: HAMT.make<Selector<any>, string>(),
    timelines: HAMT.make<Timeline, string>(),
    timelineAtoms: new Join({ relationType: `1:n` })
      .from(`timelineKey`)
      .to(`atomKey`),
    timelineStore: HAMT.make<TimelineData, string>(),
    transactions: HAMT.make<Transaction<any>, string>(),
    valueMap: HAMT.make<any, string>(),

    subject: {
      atomCreation: new Rx.Subject(),
      selectorCreation: new Rx.Subject(),
      transactionCreation: new Rx.Subject(),
      timelineCreation: new Rx.Subject(),
    },

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
