import type { Json, JsonInterface } from "anvl/json"
import * as AtomIO from "atom.io"

import type { ServerConfig } from ".."

export const useExposeSingle =
  ({ socket, store }: ServerConfig) =>
  <J extends Json>(
    token: AtomIO.StateToken<J>,
    transform: JsonInterface<J>
  ): void => {
    socket.on(`sub:${token.key}`, () => {
      socket.emit(
        `serve:${token.key}`,
        transform.toJson(AtomIO.getState(token, store))
      )
      const unsubscribe = AtomIO.subscribe(
        token,
        ({ newValue }) => {
          socket.emit(`serve:${token.key}`, transform.toJson(newValue))
        },
        store
      )
      socket.on(`unsub:${token.key}`, () => {
        unsubscribe()
      })
    })
  }
