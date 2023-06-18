import { useEffect } from "react"

import * as AtomIO from "atom.io"
import type * as SocketIO from "socket.io-client"

import type { Json, JsonInterface } from "~/packages/anvl/src/json"

export const composeRemoteSingleHook =
  (socket: SocketIO.Socket) =>
  <T>(token: AtomIO.StateToken<T>, transform: JsonInterface<T>): void => {
    useEffect(() => {
      socket.on(`serve:${token.key}`, (data: Json) => {
        return AtomIO.setState(token, transform.fromJson(data))
      })
      socket.emit(`sub:${token.key}`)
      return () => {
        socket.off(`serve:${token.key}`)
        socket.emit(`unsub:${token.key}`)
      }
    }, [token.key])
  }
