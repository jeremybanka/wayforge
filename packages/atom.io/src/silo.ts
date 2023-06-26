import { option } from "fp-ts/lib/Option"

import type { timeline } from "."
import { getState, setState, subscribe } from "."
import type { atom, atomFamily } from "./atom"
import { timeline__INTERNAL } from "./internal"
import { atom__INTERNAL } from "./internal/atom-internal"
import {
  atomFamily__INTERNAL,
  selectorFamily__INTERNAL,
} from "./internal/families-internal"
import { selector__INTERNAL } from "./internal/selector-internal"
import { createStore, type Store } from "./internal/store"
import { transaction__INTERNAL } from "./internal/transaction-internal"
import type { selector, selectorFamily } from "./selector"
import type { transaction } from "./transaction"

export const silo = (
  name: string
): {
  store: Store
  atom: typeof atom
  atomFamily: typeof atomFamily
  selector: typeof selector
  selectorFamily: typeof selectorFamily
  transaction: typeof transaction
  timeline: typeof timeline
  getState: typeof getState
  setState: typeof setState
  subscribe: typeof subscribe
} => {
  const store = createStore(name)
  return {
    store,
    atom: (options) => atom__INTERNAL(options, undefined, store),
    atomFamily: (options) => atomFamily__INTERNAL(options, store),
    selector: (options) => selector__INTERNAL(options, undefined, store) as any,
    selectorFamily: (options) => selectorFamily__INTERNAL(options, store) as any,
    transaction: (options) => transaction__INTERNAL(options, store),
    timeline: (options) => timeline__INTERNAL(options, store),
    getState: (token) => getState(token, store),
    setState: (token, newValue) => setState(token, newValue, store),
    subscribe: (token, handler) => subscribe(token, handler, store),
  }
}
