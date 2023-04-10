import type { Hamt } from "hamt_plus"
import HAMT from "hamt_plus"

import { Join } from "~/packages/anvl/src/join"

import type { Atom, ReadonlySelector, Selector } from "."

export type Store = {
  valueMap: Hamt<any, string>
  selectorGraph: Join
  selectors: Hamt<Selector<any>, string>
  readonlySelectors: Hamt<ReadonlySelector<any>, string>
  atoms: Hamt<Atom<any>, string>
  done: Set<string>
  config: {
    logger: Pick<Console, `error` | `info` | `warn`> | null
  }
}

export const createStore = (): Store =>
  ({
    valueMap: HAMT.make<any, string>(),
    selectorGraph: new Join({ relationType: `n:n` }),
    atoms: HAMT.make<Atom<any>, string>(),
    selectors: HAMT.make<Selector<any>, string>(),
    readonlySelectors: HAMT.make<ReadonlySelector<any>, string>(),
    done: new Set(),
    config: { logger: null },
  } satisfies Store)

export const IMPLICIT = {
  STORE_INTERNAL: undefined as Store | undefined,
  get STORE(): Store {
    return this.STORE_INTERNAL ?? (this.STORE_INTERNAL = createStore())
  },
}

export const operationComplete = (store: Store): void => {
  store.config.logger?.info(`   ✅`, `operation complete`)
  store.done.clear()
}

export const configureStore = (
  config: Partial<Store[`config`]>,
  store: Store = IMPLICIT.STORE
): void => {
  Object.assign(store.config, config)
}

export const clearStore = (store: Store = IMPLICIT.STORE): void => {
  const { config } = store
  Object.assign(store, createStore())
  store.config = config
}
