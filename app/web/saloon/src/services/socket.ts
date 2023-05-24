import { io } from "socket.io-client"
import type { Socket } from "socket.io-client"

import type { ReadonlySelectorToken } from "~/packages/atom.io/src"
import { atom, selector } from "~/packages/atom.io/src"

import { env } from "./env"

export const socket = io(env.VITE_REMOTE_ORIGIN)

export const initConnectionState = (
  socket: Socket
): ReadonlySelectorToken<string | null> => {
  const socketIdState_INTERNAL = atom<string | null>({
    key: `socketIdState_INTERNAL`,
    default: null,
    effects: [
      ({ setSelf, onSet }) => {
        onSet((newValue) => {
          console.log(`Connection state changed to ${newValue}`)
        })
        console.log(`Connecting...`)
        socket.on(`connection`, () => {
          console.log(`Connected`)
          setSelf(socket.id)
        })
      },
    ],
  })
  return selector<string | null>({
    key: `socketIdState`,
    get: ({ get }) => get(socketIdState_INTERNAL),
  })
}

export const socketIdState = initConnectionState(socket)
