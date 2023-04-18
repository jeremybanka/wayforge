import type { Hamt } from "hamt_plus"
import HAMT from "hamt_plus"

import { doNothing } from "~/packages/anvl/src/function"
import { Join } from "~/packages/anvl/src/join"

import type { Atom, ReadonlySelector, Selector } from "."
import type { Logger } from "./logger"

export interface Store {
  valueMap: Hamt<any, string>
  selectorGraph: Join<{ source: string }>
  selectorAtoms: Join
  atoms: Hamt<Atom<any>, string>
  atomsAreDefault: Hamt<boolean, string>
  selectors: Hamt<Selector<any>, string>
  readonlySelectors: Hamt<ReadonlySelector<any>, string>
  operation:
    | {
        open: false
      }
    | {
        open: true
        done: Set<string>
        prev: Hamt<any, string>
      }
  transaction:
    | {
        open: false
      }
    | {
        open: true
        prev: Pick<
          Store,
          | `atoms`
          | `readonlySelectors`
          | `selectorGraph`
          | `selectors`
          | `valueMap`
        >
      }
  config: {
    name: string
    logger: Logger | null
    logger__INTERNAL: Logger
  }
}

export const createStore = (name: string): Store =>
  ({
    valueMap: HAMT.make<any, string>(),
    selectorGraph: new Join({ relationType: `n:n` }),
    selectorAtoms: new Join({ relationType: `n:n` }),
    atoms: HAMT.make<Atom<any>, string>(),
    atomsAreDefault: HAMT.make<boolean, string>(),
    selectors: HAMT.make<Selector<any>, string>(),
    readonlySelectors: HAMT.make<ReadonlySelector<any>, string>(),
    operation: {
      open: false,
    },
    transaction: {
      open: false,
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
