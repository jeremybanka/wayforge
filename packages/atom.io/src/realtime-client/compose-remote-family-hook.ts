import { useEffect } from "react"

import * as AtomIO from "atom.io"
import type * as SocketIO from "socket.io-client"

import type { Json, JsonInterface } from "~/packages/anvl/src/json"

export const composeRemoteFamilyHook =
  (socket: SocketIO.Socket) =>
  <T>(
    family: AtomIO.AtomFamily<T> | AtomIO.SelectorFamily<T>,
    transform: JsonInterface<T>
  ): void => {
    useEffect(() => {
      socket.on(`serve:${family.key}`, (key: Json, data: Json) => {
        AtomIO.setState(family(key), transform.fromJson(data))
      })
      socket.emit(`sub:${family.key}`)
      return () => {
        socket.off(`serve:${family.key}`)
        socket.emit(`unsub:${family.key}`)
      }
    }, [family.key])
  }
