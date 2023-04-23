import type { AtomFamily, AtomToken } from "."
import type { Store } from "./internal"
import { target, IMPLICIT, withdraw } from "./internal"

export type TimelineToken = {
  key: string
  type: `timeline`
}

export type Timeline = {
  key: string
  type: `timeline`
  next: () => void
  prev: () => void
}

export type TimelineOptions = {
  key: string
  atoms: (AtomFamily<any> | AtomToken<any>)[]
}

export const timeline = (options: TimelineOptions): TimelineToken => {
  return timeline__INTERNAL(options)
}

export function timeline__INTERNAL(
  options: TimelineOptions,
  store: Store = IMPLICIT.STORE
): TimelineToken {
  const core = target(store)
  for (const atomOrAtomFamily of options.atoms) {
    return
  }
}
