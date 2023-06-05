import { useEffect } from "react"

import type { ƒn } from "atom.io"
import { atom, selector } from "atom.io"
import * as AtomIO from "atom.io"
import { io } from "socket.io-client"
import type * as SocketIO from "socket.io-client"
import { navigate } from "wouter/use-location"

import type { Json, JsonInterface } from "~/packages/anvl/src/json"

import { env } from "./env"

export const socket = io(env.VITE_REMOTE_ORIGIN)

export const composeServerHook =
  (socket: SocketIO.Socket) =>
  <T>(token: AtomIO.StateToken<T>, transform: JsonInterface<T>): void => {
    // console.log(`useServer`, token.key)
    useEffect(() => {
      socket.on(`serve:${token.key}`, (data: Json) => {
        // console.log(`serve:${token.key}`, data)
        return AtomIO.setState(token, transform.fromJson(data))
      })
      socket.emit(`sub:${token.key}`)
      return () => {
        socket.off(`serve:${token.key}`)
        socket.emit(`unsub:${token.key}`)
      }
    }, [token.key])
  }

export const composeServerFamilyHook =
  (socket: SocketIO.Socket) =>
  <T>(
    family: AtomIO.AtomFamily<T> | AtomIO.SelectorFamily<T>,
    transform: JsonInterface<T>
  ): void => {
    console.log(`useServerFamily`, family.key)
    useEffect(() => {
      socket.on(`serve:${family.key}`, (key: Json, data: Json) => {
        console.log(`serve:${family.key}`, key, data)
        AtomIO.setState(family(key), transform.fromJson(data))
      })
      socket.emit(`sub:${family.key}`)
      return () => {
        socket.off(`serve:${family.key}`)
        socket.emit(`unsub:${family.key}`)
      }
    }, [family.key])
  }

export const composeServerFamilyMemberHook =
  (socket: SocketIO.Socket) =>
  <T>(
    family: AtomIO.AtomFamily<T> | AtomIO.SelectorFamily<T>,
    subKey: AtomIO.Serializable,
    transform: JsonInterface<T>
  ): void => {
    console.log(`useServerFamilyMember`, family.key)
    const token = family(subKey)
    useEffect(() => {
      socket.on(`serve:${token.key}`, (data: Json) => {
        console.log(`serve:${token.key}`, data)
        AtomIO.setState(family(subKey), transform.fromJson(data))
      })
      socket.emit(`sub:${family.key}`, subKey)
      return () => {
        socket.off(`serve:${token.key}`)
        socket.emit(`unsub:${token.key}`)
      }
    }, [family.key])
  }

export const composeTransactionHook =
  (socket: SocketIO.Socket) =>
  <ƒ extends AtomIO.ƒn>(
    token: AtomIO.TransactionToken<ƒ>
  ): ((...parameters: Parameters<ƒ>) => ReturnType<ƒ>) => {
    useEffect(() => {
      const unsubscribe = AtomIO.subscribeToTransaction(token, (update) =>
        socket.emit(`tx:${token.key}`, update)
      )
      return () => unsubscribe()
    }, [token.key])
    return AtomIO.runTransaction(token)
  }

export const initConnectionState = (
  socket: SocketIO.Socket
): {
  socketIdState: AtomIO.ReadonlySelectorToken<string | null>
  useRemoteState: <T>(
    token: AtomIO.StateToken<T>,
    transform: JsonInterface<T>
  ) => void
  useRemoteFamily: <T>(
    family: AtomIO.AtomFamily<T> | AtomIO.SelectorFamily<T>,
    transform: JsonInterface<T>
  ) => void
  useRemoteFamilyMember: <T>(
    family: AtomIO.AtomFamily<T> | AtomIO.SelectorFamily<T>,
    subKey: string,
    transform: JsonInterface<T>
  ) => void
  useRemoteTransaction: <ƒ extends ƒn>(
    token: AtomIO.TransactionToken<ƒ>
  ) => (...parameters: Parameters<ƒ>) => ReturnType<ƒ>
} => {
  const socketIdState_INTERNAL = atom<string | null>({
    key: `socketIdState_INTERNAL`,
    default: null,
    effects: [
      ({ setSelf }) => {
        console.log(`Connecting...`)
        socket.on(`connection`, () => {
          console.log(`Connected`)
          setSelf(socket.id)
        })
      },
    ],
  })
  return {
    socketIdState: selector<string | null>({
      key: `socketIdState`,
      get: ({ get }) => get(socketIdState_INTERNAL),
    }),
    useRemoteState: composeServerHook(socket),
    useRemoteFamily: composeServerFamilyHook(socket),
    useRemoteFamilyMember: composeServerFamilyMemberHook(socket),
    useRemoteTransaction: composeTransactionHook(socket),
  }
}
