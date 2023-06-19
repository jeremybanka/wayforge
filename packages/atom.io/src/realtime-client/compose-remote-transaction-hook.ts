import { useEffect } from "react"

import * as AtomIO from "atom.io"
import type * as SocketIO from "socket.io-client"

import type { ƒn } from "~/packages/anvl/src/function"

const TX_SUBS = new Map<string, number>()
export const composeRemoteTransactionHook =
  (
    socket: SocketIO.Socket,
    store: AtomIO.Store = AtomIO.__INTERNAL__.IMPLICIT.STORE
  ) =>
  <ƒ extends ƒn>(
    token: AtomIO.TransactionToken<ƒ>
  ): ((...parameters: Parameters<ƒ>) => ReturnType<ƒ>) => {
    useEffect(() => {
      const count = TX_SUBS.get(token.key) ?? 0
      TX_SUBS.set(token.key, count + 1)
      const unsubscribe =
        count === 0
          ? AtomIO.subscribeToTransaction(
              token,
              (update) => socket.emit(`tx:${token.key}`, update),
              store
            )
          : () => null
      return () => {
        const newCount = TX_SUBS.get(token.key) ?? 0
        TX_SUBS.set(token.key, newCount - 1)
        unsubscribe()
      }
    }, [token.key])
    return AtomIO.runTransaction(token, store)
  }
