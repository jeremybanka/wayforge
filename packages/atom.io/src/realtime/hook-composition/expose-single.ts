import type { Json } from "anvl/json"
import * as AtomIO from "atom.io"

import type { ServerConfig } from ".."

/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
export const useExposeSingle = ({ socket, store }: ServerConfig) => {
  return function exposeSingle<J extends Json>(
    token: AtomIO.StateToken<J>
  ): void {
    socket.on(`sub:${token.key}`, () => {
      socket.emit(`serve:${token.key}`, AtomIO.getState(token, store))
      const unsubscribe = AtomIO.subscribe(
        token,
        ({ newValue }) => {
          socket.emit(`serve:${token.key}`, newValue)
        },
        store
      )
      socket.on(`unsub:${token.key}`, () => {
        unsubscribe()
      })
    })
  }
}
