import type * as Rx from "rxjs"

import type { AtomFamily, AtomToken, ƒn } from "."
import type { Store, KeyedStateUpdate, TransactionUpdate } from "./internal"
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

export type TimelineStateUpdate = KeyedStateUpdate<unknown> & {
  type: `state_update`
}
export type TimelineTransactionUpdate = TransactionUpdate<ƒn> & {
  type: `transaction_update`
}

export type TimelineData = {
  at: number
  history: (TimelineStateUpdate | TimelineTransactionUpdate)[]
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

  const subscribeToAtom = (token: AtomToken<any>) => {
    const state = withdraw(token, store)
    state.subject.subscribe((update) => {
      console.log(
        `📣 timeline "${options.key}" saw atom "${token.key}" go (`,
        update.oldValue,
        `->`,
        update.newValue,
        `)`
      )
    })
  }

  for (const tokenOrFamily of options.atoms) {
    if (tokenOrFamily.type === `atom_family`) {
      const family = tokenOrFamily
      family.subject.subscribe((token) => subscribeToAtom(token))
    } else {
      const token = tokenOrFamily
      subscribeToAtom(token)
    }
  }

  return {
    key: options.key,
    type: `timeline`,
  }
}
