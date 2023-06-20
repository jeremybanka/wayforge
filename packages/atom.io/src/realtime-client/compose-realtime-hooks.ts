import { atom, selector } from "atom.io"
import * as AtomIO from "atom.io"
import type * as SocketIO from "socket.io-client"

import type { ƒn } from "~/packages/anvl/src/function"
import type { Json } from "~/packages/anvl/src/json"

import { composeRemoteFamilyHook } from "./compose-remote-family-hook"
import { composeRemoteFamilyMemberHook } from "./compose-remote-family-member-hook"
import { composeRemoteSingleHook } from "./compose-remote-single-hook"
import { composeRemoteTransactionHook } from "./compose-remote-transaction-hook"

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
  const socketIdState_INTERNAL = atom<string | null>({
    key: `socketIdState_INTERNAL`,
    default: null,
    effects: [
      ({ setSelf }) => {
        socket.on(`connection`, () => {
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
    useRemoteState: composeRemoteSingleHook(socket, store),
    useRemoteFamily: composeRemoteFamilyHook(socket, store),
    useRemoteFamilyMember: composeRemoteFamilyMemberHook(socket, store),
    useRemoteTransaction: composeRemoteTransactionHook(socket, store),
  }
}
