import { useEffect } from "react"

import * as AtomIO from "atom.io"
import type * as SocketIO from "socket.io-client"

import type { Json } from "~/packages/anvl/src/json"

export const realtimeClientFamilyMemberHook =
  (
    socket: SocketIO.Socket,
    store: AtomIO.Store = AtomIO.__INTERNAL__.IMPLICIT.STORE
  ) =>
  <J extends Json>(
    family: AtomIO.AtomFamily<J> | AtomIO.SelectorFamily<J>,
    subKey: AtomIO.Serializable
  ): void => {
    const token = family(subKey)
    useEffect(() => {
      socket.on(`serve:${token.key}`, (data: J) => {
        AtomIO.setState(family(subKey), data, store)
      })
      socket.emit(`sub:${family.key}`, subKey)
      return () => {
        socket.off(`serve:${token.key}`)
        socket.emit(`unsub:${token.key}`)
      }
    }, [family.key])
  }
