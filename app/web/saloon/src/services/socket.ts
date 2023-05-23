import { io } from "socket.io-client"
import type { Socket } from "socket.io-client"

import type { ReadonlySelectorToken } from "~/packages/atom.io/src"
import { atom, selector } from "~/packages/atom.io/src"

import { env } from "./env"

export const socket = io(env.VITE_REMOTE_ORIGIN)

// export const initConnectionState = (
//   socket: ClienteleUser
// ): ReadonlySelectorToken<
//   ClienteleError | `Connected` | `Disconnected` | `Searching`
// > => {
//   const connectionState_INTERNAL = atom<
//     ClienteleError | `Connected` | `Disconnected` | `Searching`
//   >({
//     key: `connection_INTERNAL`,
//     default: `Searching`,
//     effects: [
//       ({ setSelf }) => {
//         socket.on(`connection`, () => {
//           console.log(`Connected`)
//           setSelf(`Connected`)
//         })
//       },
//     ],
//   })
//   return selector({
//     key: `connection`,
//     get: ({ get }) => get(connectionState_INTERNAL),
//   })
// }

export const connectionState = initConnectionState(socket)
