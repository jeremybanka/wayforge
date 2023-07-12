import * as React from "react"

import * as AtomIO from "atom.io"

import type { Json } from "~/packages/anvl/src/json"

import { RealtimeContext } from "./realtime-context"
import { StoreContext } from "../react"

export function usePullFamily<J extends Json>(
  family: AtomIO.AtomFamily<J> | AtomIO.SelectorFamily<J>
): void {
  const { socket } = React.useContext(RealtimeContext)
  const store = React.useContext(StoreContext)
  React.useEffect(() => {
    socket.on(`serve:${family.key}`, (key: Json, data: J) => {
      AtomIO.setState(family(key), data, store)
    })
    socket?.emit(`sub:${family.key}`)
    return () => {
      socket?.off(`serve:${family.key}`)
      socket?.emit(`unsub:${family.key}`)
    }
  }, [family.key])
}
