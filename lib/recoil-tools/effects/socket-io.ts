import { pipe } from "fp-ts/lib/function"
import type { AtomEffect } from "recoil"
import type { io, Socket } from "socket.io-client"

import type { Json, Primitive } from "~/lib/json"

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
    socket.on(`${type}:${id}`, (json) => setSelf(fromJson(json)))
    onSet((v) => socket.emit(`write`, { id, type, value: toJson(v) }))
  }

export type SocketIndexOptions<T> = {
  type: string
  socket: Socket
  jsonInterface: JsonInterface<T>
}

export const socketIndex: <T>(options: SocketIndexOptions<T>) => AtomEffect<T> =
  ({ type, socket, jsonInterface: { toJson, fromJson } }) =>
  ({ setSelf, onSet }) => {
    socket.emit(`index:read`, { type })
    socket.on(`index:${type}`, (json) => setSelf(fromJson(json)))
    onSet((v) => socket.emit(`index:write`, { type, value: toJson(v) }))
  }
