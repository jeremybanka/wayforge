import type { Refinement } from "fp-ts/lib/Refinement"
import type { AtomEffect } from "recoil"
import type { Socket } from "socket.io-client"

import { Join } from "~/packages/Anvil/src/join"
import type { JsonObj } from "~/packages/Anvil/src/json"

import type { JsonInterface } from "."
import type { SaveJsonEmitEvents, SaveJsonListenEvents } from "./socket-io.node"

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

// Type 'AtomEffect<Join<JsonObj<string, Serializable> | null>>
export const socketIndex: <T>(options: SocketIndexOptions<T>) => AtomEffect<T> =
  ({ type, socket, jsonInterface: { toJson, fromJson } }) =>
  ({ setSelf, onSet }) => {
    socket.emit(`indexRead`, { type })
    socket.on(`indexRead_${type}`, (json) => setSelf(fromJson(json)))
    onSet((v) => socket.emit(`indexWrite`, { type, value: toJson(v) }))
  }

export type SocketRelationsOptions<CONTENT extends JsonObj | null = null> =
  (CONTENT extends null
    ? {
        refineContent: null
      }
    : {
        refineContent: Refinement<unknown, CONTENT>
      }) & {
    id: string
    type: string
    socket: Socket<SaveJsonListenEvents, SaveJsonEmitEvents>
  }

export const socketRelations: <
  CONTENT extends JsonObj | null = null,
  JOIN extends Join<CONTENT> = Join<CONTENT>
>(
  options: SocketRelationsOptions<CONTENT>
) => AtomEffect<JOIN> =
  ({ type, id, socket, refineContent }) =>
  <CONTENT extends JsonObj | null = null>({ setSelf, onSet }) => {
    socket.emit(`relationsRead`, { type, id })
    socket.on(`relationsRead_${id}`, (json) =>
      setSelf(
        Join.fromJSON<CONTENT>(
          json,
          refineContent as Refinement<unknown, CONTENT>
        )
      )
    )
    onSet((v) => socket.emit(`relationsWrite`, { id, type, value: v.toJSON() }))
  }
