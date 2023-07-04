import { atom, selector } from "atom.io"
import * as AtomIO from "atom.io"
import type * as SocketIO from "socket.io-client"

import type { ƒn } from "~/packages/anvl/src/function"
import type { Json } from "~/packages/anvl/src/json"

import { realtimeClientFamilyHook } from "./realtime-client-family"
import { realtimeClientFamilyMemberHook } from "./realtime-client-family-member"
import { realtimeClientSingleHook } from "./realtime-client-single"
import { realtimeClientTransactionHook } from "./realtime-client-transaction"
import { atom__INTERNAL, selector__INTERNAL } from "../../internal"

export const composeRealtimeHooks = (
  socket: SocketIO.Socket,
  store: AtomIO.Store = AtomIO.__INTERNAL__.IMPLICIT.STORE
): {
  socketIdState: AtomIO.ReadonlySelectorToken<string | null>
  useRemoteState: <J extends Json>(token: AtomIO.StateToken<J>) => void
  useRemoteFamily: <J extends Json>(
    family: AtomIO.AtomFamily<J> | AtomIO.SelectorFamily<J>
  ) => void
  useRemoteFamilyMember: <J extends Json>(
    family: AtomIO.AtomFamily<J> | AtomIO.SelectorFamily<J>,
    subKey: string
  ) => void
  useRemoteTransaction: <ƒ extends ƒn>(
    token: AtomIO.TransactionToken<ƒ>
  ) => (...parameters: Parameters<ƒ>) => ReturnType<ƒ>
} => {
  const socketIdState_INTERNAL = atom__INTERNAL<string | null>(
    {
      key: `socketIdState_INTERNAL`,
      default: null,
      effects: [
        ({ setSelf }) => {
          socket.on(`connection`, () => {
            setSelf(socket.id)
          })
        },
      ],
    },
    undefined,
    store
  )
  return {
    socketIdState: selector__INTERNAL<string | null>(
      {
        key: `socketIdState`,
        get: ({ get }) => get(socketIdState_INTERNAL),
      },
      undefined,
      store
    ),
    useRemoteState: realtimeClientSingleHook(socket, store),
    useRemoteFamily: realtimeClientFamilyHook(socket, store),
    useRemoteFamilyMember: realtimeClientFamilyMemberHook(socket, store),
    useRemoteTransaction: realtimeClientTransactionHook(socket, store),
  }
}
