import type { AtomEffect } from "recoil"
import type { Socket } from "socket.io-client"

import type {
  SaveJsonEmitEvents,
  SaveJsonListenEvents,
} from "~/lib/recoil-tools/effects/socket-io.server"

import type { JsonInterface } from "."

export type SocketSyncOptions<T> = {
  id: string
  type: string
  socket: Socket
  jsonInterface: JsonInterface<T>
}

export const socketSync: <T>(options: SocketSyncOptions<T>) => AtomEffect<T> =
  ({ id, type, socket, jsonInterface: { toJson, fromJson } }) =>
  ({ setSelf, onSet }) => {
    socket.emit(`read`, { type, id })
    socket.on(`${type}_${id}`, (json) => setSelf(fromJson(json)))
    onSet((v) => socket.emit(`write`, { id, type, value: toJson(v) }))
  }

export type SocketIndexOptions<T> = {
  type: string
  socket: Socket<SaveJsonListenEvents, SaveJsonEmitEvents>
  jsonInterface: JsonInterface<T>
}

export const socketIndex: <T>(options: SocketIndexOptions<T>) => AtomEffect<T> =
  ({ type, socket, jsonInterface: { toJson, fromJson } }) =>
  ({ setSelf, onSet }) => {
    socket.emit(`indexRead`, { type })
    socket.on(`indexRead_${type}`, (json) => setSelf(fromJson(json)))
    onSet((v) => socket.emit(`indexWrite`, { type, value: toJson(v) }))
  }
