import HAMT from "hamt_plus"
import type * as Rx from "rxjs"

import type { AtomFamily, AtomToken, ƒn } from "."
import { setState } from "."
import type { Store, KeyedStateUpdate, TransactionUpdate } from "./internal"
import { target, IMPLICIT, withdraw } from "./internal"
import {
  redo__INTERNAL,
  timeline__INTERNAL,
  undo__INTERNAL,
} from "./internal/timeline-internal"

export type TimelineToken = {
  key: string
  type: `timeline`
}

export type TimelineOptions = {
  key: string
  atoms: (AtomFamily<any> | AtomToken<any>)[]
}

export const timeline = (options: TimelineOptions): TimelineToken => {
  return timeline__INTERNAL(options)
}

export const redo = (token: TimelineToken): void => {
  return redo__INTERNAL(token, IMPLICIT.STORE)
}

export const undo = (token: TimelineToken): void => {
  return undo__INTERNAL(token, IMPLICIT.STORE)
}
