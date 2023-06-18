import { useEffect } from "react"

import * as AtomIO from "atom.io"
import type * as SocketIO from "socket.io-client"

import type { Json, JsonInterface } from "~/packages/anvl/src/json"

export const composeRemoteFamilyMemberHook =
  (socket: SocketIO.Socket) =>
  <T>(
    family: AtomIO.AtomFamily<T> | AtomIO.SelectorFamily<T>,
    subKey: AtomIO.Serializable,
    transform: JsonInterface<T>
  ): void => {
    const token = family(subKey)
    useEffect(() => {
      socket.on(`serve:${token.key}`, (data: Json) => {
        AtomIO.setState(family(subKey), transform.fromJson(data))
      })
      socket.emit(`sub:${family.key}`, subKey)
      return () => {
        socket.off(`serve:${token.key}`)
        socket.emit(`unsub:${token.key}`)
      }
    }, [family.key])
  }
