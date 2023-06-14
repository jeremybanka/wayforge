import type { Json, JsonInterface } from "anvl/json"
import { parseJson } from "anvl/json"
import * as AtomIO from "atom.io"
import type * as SocketIO from "socket.io"

export const serve = <J extends Json>(
  socket: SocketIO.Socket,
  token: AtomIO.StateToken<J>,
  transform: JsonInterface<J>
): void => {
  socket.on(`sub:${token.key}`, () => {
    socket.emit(`serve:${token.key}`, transform.toJson(AtomIO.getState(token)))
    const unsubscribe = AtomIO.subscribe(token, ({ newValue }) => {
      socket.emit(`serve:${token.key}`, transform.toJson(newValue))
    })
    socket.on(`unsub:${token.key}`, () => {
      unsubscribe()
    })
  })
}

export const serveFamily = <T>(
  socket: SocketIO.Socket,
  family: AtomIO.AtomFamily<T> | AtomIO.SelectorFamily<T>,
  index: AtomIO.StateToken<Set<string>>,
  transform: JsonInterface<T>
): void => {
  socket.on(`sub:${family.key}`, (subKey?: AtomIO.Serializable) => {
    if (subKey === undefined) {
      const keys = AtomIO.getState(index)
      keys.forEach((key) => {
        const token = family(key)
        socket.emit(
          `serve:${family.key}`,
          parseJson(token.family?.subKey || `null`),
          transform.toJson(AtomIO.getState(token))
        )
      })

      const subscription =
        family.type === `atom_family`
          ? family.subject.subscribe((token) => {
              AtomIO.subscribe(token, ({ newValue }) => {
                socket.emit(
                  `serve:${family.key}`,
                  parseJson(token.family?.subKey || `null`),
                  transform.toJson(newValue)
                )
              })
            })
          : family.subject.subscribe((token) => {
              AtomIO.subscribe(token, ({ newValue }) => {
                socket.emit(
                  `serve:${family.key}`,
                  parseJson(token.family?.subKey || `null`),
                  transform.toJson(newValue)
                )
              })
            })

      socket.on(`unsub:${family.key}`, () => {
        subscription.unsubscribe()
      })
    } else {
      const token = family(subKey)
      socket.emit(`serve:${token.key}`, transform.toJson(AtomIO.getState(token)))
      const unsubscribe = AtomIO.subscribe(token, ({ newValue }) => {
        socket.emit(`serve:${token.key}`, transform.toJson(newValue))
      })
      socket.on(`unsub:${token.key}`, () => {
        socket.emit(`unsub:${token.key}`)
        unsubscribe()
      })
    }
  })
}

export const composeServerSideHooks = <J extends Json>(
  socket: SocketIO.Socket,
  store?: AtomIO.__INTERNAL__.Store
): {
  serve: (token: AtomIO.StateToken<J>, transform: JsonInterface<J>) => void
  serveFamily: <T>(
    family: AtomIO.AtomFamily<T> | AtomIO.SelectorFamily<T>,
    index: AtomIO.StateToken<Set<string>>,
    transform: JsonInterface<T>
  ) => void
} => {
  return {
    serve: (token, transform) => serve(socket, token, transform),
    serveFamily: (family, index, transform) =>
      serveFamily(socket, family, index, transform),
  }
}
