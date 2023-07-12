import { lookupSelectorSources } from "./lookup-selector-sources"
import type { Store, AtomToken, ReadonlySelectorToken, StateToken } from "../.."

export const traceSelectorAtoms = (
  selectorKey: string,
  dependency: ReadonlySelectorToken<unknown> | StateToken<unknown>,
  store: Store
): AtomToken<unknown>[] => {
  const roots: AtomToken<unknown>[] = []

  const sources = lookupSelectorSources(dependency.key, store)
  let depth = 0
  while (sources.length > 0) {
    /* eslint-disable-next-line @typescript-eslint/no-non-null-assertion */
    const source = sources.shift()!
    ++depth
    if (depth > 999) {
      throw new Error(
        `Maximum selector dependency depth exceeded in selector "${selectorKey}".`
      )
    }

    if (source.type !== `atom`) {
      sources.push(...lookupSelectorSources(source.key, store))
    } else {
      roots.push(source)
    }
  }

  return roots
}

export const traceAllSelectorAtoms = (
  selectorKey: string,
  store: Store
): AtomToken<unknown>[] => {
  const sources = lookupSelectorSources(selectorKey, store)
  return sources.flatMap((source) =>
    source.type === `atom`
      ? source
      : traceSelectorAtoms(selectorKey, source, store)
  )
}
