import { identity } from "fp-ts/function"
import type { Refinement } from "fp-ts/Refinement"
import type { AtomEffect } from "recoil"
import type { Socket } from "socket.io-client"

import { Join } from "~/packages/anvl/src/join"
import type {
  Json,
  JsonArr,
  JsonInterface,
  JsonObj,
} from "~/packages/anvl/src/json"

import type {
  JsonStoreClientEvents,
  JsonStoreServerEvents,
} from "./json-store-io.node"

export type SocketSyncOptions = {
  id: string
  type: string
  socket: Socket<JsonStoreServerEvents, JsonStoreClientEvents>
}

export const socketSync: <T>(
  options: T extends Json
    ? SocketSyncOptions
    : JsonInterface<T> & SocketSyncOptions
) => AtomEffect<T> = (options) =>
  // @ts-expect-error typescript isn't smart enough to get this idea
  smartSocketSync({ toJson: identity, fromJson: identity, ...options })

export const smartSocketSync = <T>(
  options: JsonInterface<T> & SocketSyncOptions
): AtomEffect<T> => {
  const { id, type, socket, toJson, fromJson } = options
  return ({ setSelf, onSet }) => {
    socket.emit(`read`, { id, type })
    socket.on(`read_${id}`, (json) => setSelf(fromJson(json)))
    onSet((v) => socket.emit(`write`, { id, type, value: toJson(v) }))
  }
}

export type SocketIndexOptions<T> = {
  type: string
  socket: Socket<JsonStoreServerEvents, JsonStoreClientEvents>
  jsonInterface: JsonInterface<T, JsonArr<string>>
}

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
    socket: Socket<JsonStoreServerEvents, JsonStoreClientEvents>
  }

export const socketRelations: <CONTENT extends JsonObj | null = null>(
  options: SocketRelationsOptions<CONTENT>
) => AtomEffect<Join<CONTENT>> =
  ({ type, id, socket, refineContent }) =>
  <CONTENT extends JsonObj | null = null>({ setSelf, onSet }) => {
    socket.emit(`relationsRead`, { type, id })
    socket.on(`relationsRead_${type}_${id}`, (json) =>
      setSelf(
        Join.fromJSON<CONTENT>(
          json,
          refineContent as Refinement<unknown, CONTENT>
        )
      )
    )
    onSet((v: Join) =>
      socket.emit(`relationsWrite`, { id, type, value: v.toJSON() })
    )
  }
