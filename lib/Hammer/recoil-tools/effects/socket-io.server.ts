import { readdirSync, readFileSync, renameSync, writeFileSync } from "fs"

import type { Modifier } from "anvl/function"
import { identify } from "anvl/id/identified"
import type { Json, JsonObj } from "anvl/json"
import { parseJson } from "anvl/json"
import type { Socket, ServerOptions } from "socket.io"
import { Server as WebSocketServer } from "socket.io"
import type { EventsMap } from "socket.io/dist/typed-events"

import {
  getDirectoryJsonArr,
  getDirectoryJsonEntries,
} from "~/lib/node/json-fs.server"

const { log } = console

export type RelationType = `${string}_${string}`

const isRelationType = (input: unknown): input is RelationType =>
  typeof input === `string` && input.length > 2 && input.split(`_`).length === 2

const makeIndexer =
  (jsonRoot: string) =>
  (type: string): string[] => {
    const directory = `${jsonRoot}/${type}`
    const jsonContents = getDirectoryJsonArr({
      dir: directory,
      coerce: identify,
    })
    const ids = jsonContents.map((data) => data.id)
    return ids
  }

const makeRelationIndexReader =
  (jsonRoot: string) =>
  (type: RelationType, id: string): Json => {
    const directory = `${jsonRoot}/_relations/${type}`
    const fileName = `${directory}/${id}.json`
    const fileText = readFileSync(fileName, `utf8`)
    const json = parseJson(fileText)
    return json
  }

/* prettier-ignore */
export type SaveJsonListenEvents = 
  Record<
    `indexRead_${string}`, 
    (vars: JsonObj) => void
  > &
  Record<
    `relationsRead_${string}`, 
    (vars: JsonObj) => void
  > & {
    read: (vars: { type: string; id: string }) => void
    write: (vars: { type: string; id: string; value: unknown }) => void
    indexRead: (vars: { type: string }) => void
    indexWrite: (vars: { type: string; value: string[] }) => void
    relationsRead: (vars: { type: string; id: string }) => void
    relationsWrite: (vars: { type: string; id: string; value: Json }) => void
  }
/* end-prettier-ignore */

export interface SaveJsonEmitEvents extends EventsMap {
  indexRead: ({ type }: { type: string }) => void
}

export interface SaveJsonServerSideEvents extends EventsMap {
  indexRead: ({ type }: { type: string }) => void
}

export type SaveJsonOptions = {
  formatter: Modifier<string>
  nameFile: (type: string, value: unknown) => string
  jsonRoot: string
}

export const SaveJsonWebsocketServer = (
  port: number,
  opts: Partial<ServerOptions>,
  { formatter = (s) => s, nameFile, jsonRoot }: SaveJsonOptions
): WebSocketServer<
  SaveJsonListenEvents,
  SaveJsonEmitEvents,
  SaveJsonServerSideEvents
> =>
  new WebSocketServer(port, opts).on(
    `connection`,
    (
      socket: Socket<
        SaveJsonListenEvents,
        SaveJsonEmitEvents,
        SaveJsonServerSideEvents
      >
    ) => {
      console.log(socket.id, `connected`)
      socket.emit(`event`, `connected!`)

      const index = makeIndexer(jsonRoot)
      const relate = makeRelationIndexReader(jsonRoot)

      const sendToTrash = (type: string, id: string) => {
        const fileNames = readdirSync(`${jsonRoot}/${type}`)
        const fileName = fileNames.find((name) => name.includes(id))
        renameSync(
          `${jsonRoot}/${type}/${fileName}`,
          `${jsonRoot}/${type}/_trash/${fileName}`
        )
        // assignToJsonFile({
        //   path: `${jsonRoot}/${type}/index.json`,
        //   properties: { [id]: undefined },
        // })
      }

      socket.on(`read`, ({ id, type }) => {
        log(socket.id, `read`, id, type)
        const dir = `${jsonRoot}/${type}`
        const entries = getDirectoryJsonEntries({
          dir,
          coerce: identify,
        })
        const matchingEntry = entries.find(([, data]) => data.id === id)
        if (matchingEntry) {
          const [, fileContents] = matchingEntry
          socket.emit(`${type}_${id}`, fileContents)
        }
      })
      socket.on(`relationsRead`, ({ id, type }) => {
        log(socket.id, `relationsRead`, type, id)
        const dir = `${jsonRoot}/_relations/${type}`
        console.log(dir)
        if (isRelationType(type)) {
          const data = relate(type, id)
          console.log({ data })
          socket.emit(`relationsRead_${id}`, data)
        }
      })

      socket.on(`indexRead`, ({ type }) => {
        log(socket.id, `indexRead`, type)
        const ids = index(type)
        console.log({ ids })
        socket.emit(`indexRead_${type}`, ids)
      })

      socket.on(`write`, ({ id, type, value }) => {
        log(socket.id, `write`, id, value)
        const valueAsString = JSON.stringify(value)
        const formatted = formatter(valueAsString)
        const newFilePath = nameFile(type, value) + `.json`
        const allFileNames = readdirSync(`${jsonRoot}/${type}`)
        const prevFileName = allFileNames.find((name) => name.includes(id))
        const prevFilePath = type + `/` + prevFileName
        if (prevFileName && prevFilePath !== newFilePath) {
          renameSync(`${jsonRoot}/${prevFilePath}`, `${jsonRoot}/${newFilePath}`)
        }
        writeFileSync(`${jsonRoot}/${newFilePath}`, formatted)
      })

      socket.on(`relationsWrite`, ({ id, type, value }) => {
        log(socket.id, `relationsWrite`, id, value)
        const valueAsString = JSON.stringify(value)
        const formatted = formatter(valueAsString)
        const newFilePath = `${type}/${id}.json`
        writeFileSync(`${jsonRoot}/_relations/${newFilePath}`, formatted)
      })

      socket.on(`indexWrite`, ({ type, value: newIds }) => {
        log(socket.id, `indexWrite`, type)
        const ids = index(type)
        const toBeDeleted = ids.filter((id) => !newIds.includes(id))
        console.log(`⚠️`, { newIds, toBeDeleted })
        const fileNames = readdirSync(`${jsonRoot}/${type}`)

        toBeDeleted.forEach((id) => {
          const fileName = fileNames.find((name) => name.includes(id))
          renameSync(
            `${jsonRoot}/${type}/${fileName}`,
            `${jsonRoot}/${type}/_trash/${fileName}`
          )
        })
      })
    }
  )
