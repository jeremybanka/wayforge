import type { Store } from ".."
import { target, lookup } from ".."
import type { AtomToken, ReadonlySelectorToken, SelectorToken } from "../.."

export const lookupSelectorSources = (
  key: string,
  store: Store
): (
  | AtomToken<unknown>
  | ReadonlySelectorToken<unknown>
  | SelectorToken<unknown>
)[] =>
  target(store)
    .selectorGraph.getRelations(key)
    .filter(({ source }) => source !== key)
    .map(({ source }) => lookup(source, store))
