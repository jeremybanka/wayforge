import type { Hamt } from "hamt_plus"
import HAMT from "hamt_plus"

import { Join } from "~/packages/anvl/src/join"

import type { Atom, ReadonlySelector, Selector } from "."

export type StoreBase = {
  valueMap: Hamt<any, string>
  selectorGraph: Join
  selectors: Hamt<Selector<any>, string>
  readonlySelectors: Hamt<ReadonlySelector<any>, string>
  atoms: Hamt<Atom<any>, string>
}

export interface Store extends StoreBase {
  action:
    | {
        open: false
      }
    | {
        open: true
        done: Set<string>
        prev: Hamt<any, string>
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
    atoms: HAMT.make<Atom<any>, string>(),
    selectors: HAMT.make<Selector<any>, string>(),
    readonlySelectors: HAMT.make<ReadonlySelector<any>, string>(),
    action: {
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

export const finishAction = (store: Store): void => {
  store.action = { open: false }
  store.config.logger?.info(`   ✅`, `operation complete`)
}

export const startAction = (store: Store): void => {
  store.action = {
    open: true,
    done: new Set(),
    prev: store.valueMap,
  }
  store.config.logger?.info(`   ⚠️`, `action started`)
}

export const isDone = (key: string, store: Store = IMPLICIT.STORE): boolean => {
  if (!store.action.open) {
    store.config.logger?.warn(
      `isDone called outside of an action. This is probably a bug.`
    )
    return true
  }
  return store.action.done.has(key)
}
export const markDone = (key: string, store: Store = IMPLICIT.STORE): void => {
  if (!store.action.open) {
    store.config.logger?.warn(
      `markDone called outside of an action. This is probably a bug.`
    )
    return
  }
  store.action.done.add(key)
}
export const recall = <T>(
  state: Atom<T> | ReadonlySelector<T> | Selector<T>,
  store: Store = IMPLICIT.STORE
): T => {
  if (!store.action.open) {
    store.config.logger?.warn(
      `recall called outside of an action. This is probably a bug.`
    )
    return HAMT.get(state.key, store.valueMap)
  }
  return HAMT.get(state.key, store.action.prev)
}

export const configureStore = (
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
