import type { AtomFamily, AtomToken } from "."
import { IMPLICIT } from "./internal"
import { redo__INTERNAL, timeline__INTERNAL, undo__INTERNAL } from "./internal/"

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
