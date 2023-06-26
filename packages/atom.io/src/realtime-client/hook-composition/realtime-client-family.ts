import { useEffect } from "react"

import * as AtomIO from "atom.io"
import type * as SocketIO from "socket.io-client"

import type { Json } from "~/packages/anvl/src/json"

export const realtimeClientFamilyHook =
  (
    socket: SocketIO.Socket,
    store: AtomIO.Store = AtomIO.__INTERNAL__.IMPLICIT.STORE
  ) =>
  <J extends Json>(
    family: AtomIO.AtomFamily<J> | AtomIO.SelectorFamily<J>
  ): void => {
    useEffect(() => {
      socket.on(`serve:${family.key}`, (key: Json, data: J) => {
        AtomIO.setState(family(key), data, store)
      })
      socket.emit(`sub:${family.key}`)
      return () => {
        socket.off(`serve:${family.key}`)
        socket.emit(`unsub:${family.key}`)
      }
    }, [family.key])
  }
