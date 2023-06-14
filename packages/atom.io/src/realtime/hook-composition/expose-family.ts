import type { Json, JsonInterface } from "anvl/json"
import { parseJson } from "anvl/json"
import * as AtomIO from "atom.io"

import type { ServerConfig } from ".."

export const useExposeFamily =
  ({ socket, store }: ServerConfig) =>
  <J extends Json>(
    family: AtomIO.AtomFamily<J> | AtomIO.SelectorFamily<J>,
    index: AtomIO.StateToken<Set<string>>,
    transform: JsonInterface<J>
  ): void => {
    socket.on(`sub:${family.key}`, (subKey?: AtomIO.Serializable) => {
      if (subKey === undefined) {
        const keys = AtomIO.getState(index, store)
        keys.forEach((key) => {
          const token = family(key)
          socket.emit(
            `serve:${family.key}`,
            parseJson(token.family?.subKey || `null`),
            transform.toJson(AtomIO.getState(token, store))
          )
        })

        const subscription =
          family.type === `atom_family`
            ? family.subject.subscribe((token) => {
                AtomIO.subscribe(
                  token,
                  ({ newValue }) => {
                    socket.emit(
                      `serve:${family.key}`,
                      parseJson(token.family?.subKey || `null`),
                      transform.toJson(newValue)
                    )
                  },
                  store
                )
              })
            : family.subject.subscribe((token) => {
                AtomIO.subscribe(
                  token,
                  ({ newValue }) => {
                    socket.emit(
                      `serve:${family.key}`,
                      parseJson(token.family?.subKey || `null`),
                      transform.toJson(newValue)
                    )
                  },
                  store
                )
              })

        socket.on(`unsub:${family.key}`, () => {
          subscription.unsubscribe()
        })
      } else {
        const token = family(subKey)
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
          socket.emit(`unsub:${token.key}`)
          unsubscribe()
        })
      }
    })
  }
