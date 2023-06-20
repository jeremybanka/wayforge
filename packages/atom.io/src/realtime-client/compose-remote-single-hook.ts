import * as React from "react"

import * as AtomIO from "atom.io"
import type * as SocketIO from "socket.io-client"

import type { Json } from "~/packages/anvl/src/json"

export const composeRemoteSingleHook =
  (
    socket: SocketIO.Socket,
    store: AtomIO.Store = AtomIO.__INTERNAL__.IMPLICIT.STORE
  ) =>
  <J extends Json>(token: AtomIO.StateToken<J>): void => {
    React.useEffect(() => {
      socket.on(`serve:${token.key}`, (data: J) => {
        AtomIO.setState(token, data, store)
      })
      socket.emit(`sub:${token.key}`)
      return () => {
        socket.off(`serve:${token.key}`)
        socket.emit(`unsub:${token.key}`)
      }
    }, [token.key])
  }
