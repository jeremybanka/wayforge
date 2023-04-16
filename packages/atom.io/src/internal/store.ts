import type { Hamt } from "hamt_plus"
import HAMT from "hamt_plus"

import { Join } from "~/packages/anvl/src/join"

import type { Atom, ReadonlySelector, Selector } from "."

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
    logger: Pick<Console, `error` | `info` | `warn`> | null
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
      logger: null,
    },
  } satisfies Store)

export const IMPLICIT = {
  STORE_INTERNAL: undefined as Store | undefined,
  get STORE(): Store {
    return this.STORE_INTERNAL ?? (this.STORE_INTERNAL = createStore(`DEFAULT`))
  },
}
export const configure = (
  config: Partial<Store[`config`]>,
  store: Store = IMPLICIT.STORE
): void => {
  Object.assign(store.config, config)
}

export const clearStore = (store: Store = IMPLICIT.STORE): void => {
  const { config } = store
  Object.assign(store, createStore(config.name))
  store.config = config
}
