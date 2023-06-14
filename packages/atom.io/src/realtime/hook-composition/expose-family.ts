import type { Json } from "anvl/json"
import { parseJson } from "anvl/json"
import * as AtomIO from "atom.io"

import type { ServerConfig } from ".."

/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
export const useExposeFamily = ({ socket, store }: ServerConfig) => {
  function exposeFamily<J extends Json>(
    family: AtomIO.AtomFamily<J> | AtomIO.SelectorFamily<J>,
    index: AtomIO.StateToken<Set<string>>
  ): void {
    socket.on(`sub:${family.key}`, (subKey?: AtomIO.Serializable) => {
      if (subKey === undefined) {
        const keys = AtomIO.getState(index, store)
        keys.forEach((key) => {
          const token = family(key)
          socket.emit(
            `serve:${family.key}`,
            parseJson(token.family?.subKey || `null`),
            AtomIO.getState(token, store)
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
                      newValue
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
                      newValue
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
        socket.emit(`serve:${token.key}`, AtomIO.getState(token, store))
        const unsubscribe = AtomIO.subscribe(
          token,
          ({ newValue }) => {
            socket.emit(`serve:${token.key}`, newValue)
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
  return exposeFamily
}
