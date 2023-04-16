import HAMT from "hamt_plus"

import type { Store } from "."
import { IMPLICIT, traceAllSelectorAtoms } from "."

export const isAtomDefault = (
  key: string,
  store: Store = IMPLICIT.STORE
): boolean => {
  return HAMT.get(key, store.atomsAreDefault)
}

export const isSelectorDefault = (
  key: string,
  store: Store = IMPLICIT.STORE
): boolean => {
  const roots = traceAllSelectorAtoms(key, store)
  return roots.every((root) => isAtomDefault(root.key, store))
}
