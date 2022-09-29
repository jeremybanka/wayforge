import type { Refinement } from "fp-ts/lib/Refinement"
import type { AtomEffect } from "recoil"
import type { Socket } from "socket.io-client"

import type { Json } from "~/lib/json"
import type {
  SaveJsonEmitEvents,
  SaveJsonListenEvents,
} from "~/lib/recoil-tools/effects/socket-io.server"
// import { RelationSet } from "~/lib/RelationSet"

import type { JsonInterface } from "."
import { Join } from "../../dynamic-relations/relation-map"

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

export type SocketRelationsOptions<CONTENT extends Json> = {
  id: string
  type: string
  socket: Socket<SaveJsonListenEvents, SaveJsonEmitEvents>
  refineContent: Refinement<unknown, CONTENT>
}

export const socketRelations: <CONTENT extends Json>(
  options: SocketRelationsOptions<CONTENT>
) => AtomEffect<Join<CONTENT>> =
  ({ type, id, socket, refineContent }) =>
  ({ setSelf, onSet }) => {
    socket.emit(`relationsRead`, { type, id })
    socket.on(
      `relationsRead_${id}`,
      (json) => (
        console.log(`received relations: ${id}`),
        // console.log({ json, refined: Join.fromJSON(refineContent)(json) }),
        setSelf(Join.fromJSON(refineContent)(json))
      )
    )
    onSet((v) => socket.emit(`relationsWrite`, { id, type, value: v.toJSON() }))
  }
