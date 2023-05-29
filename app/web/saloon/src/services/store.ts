import { useEffect } from "react"

import * as AtomIO from "atom.io"
import type * as SocketIO from "socket.io-client"

import type { Json, JsonInterface } from "~/packages/anvl/src/json"

const LOG_LEVELS = [null, `error`, `warn`, `info`] as const
AtomIO.setLogLevel(LOG_LEVELS[2])

export const useServer = <T>(
  socket: SocketIO.Socket,
  token: AtomIO.StateToken<T>,
  transform: JsonInterface<T>
): void => {
  console.log(`useServer`, token.key)
  useEffect(() => {
    socket.on(`serve:${token.key}`, (data: Json) => {
      console.log(`serve:${token.key}`, data)
      return AtomIO.setState(token, transform.fromJson(data))
    })
    socket.emit(`sub:${token.key}`)
    return () => {
      socket.off(`serve:${token.key}`)
      socket.emit(`unsub:${token.key}`)
    }
  }, [token.key])
}

export const useServerFamily = <T>(
  socket: SocketIO.Socket,
  family: AtomIO.AtomFamily<T> | AtomIO.SelectorFamily<T>,
  subKey: AtomIO.Serializable,
  transform: JsonInterface<T>
): void => {
  console.log(`useServerFamily`, family.key)
  const token = family(subKey)
  useEffect(() => {
    socket.on(`serve:${token.key}`, (data: Json) => {
      console.log(`serve:${family.key}`, data)
      return AtomIO.setState(family(subKey), transform.fromJson(data))
    })
    socket.emit(`sub:${family.key}`, subKey)
    return () => {
      socket.off(`serve:${token.key}`)
      socket.emit(`unsub:${token.key}`)
    }
  }, [family.key])
}
