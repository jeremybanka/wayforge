import { readdirSync, renameSync, writeFileSync } from "fs"

import type { Refinement } from "fp-ts/lib/Refinement"
import type { Socket, ServerOptions } from "socket.io"
import { Server as WebSocketServer } from "socket.io"
import type { EventsMap } from "socket.io/dist/typed-events"

// import energySchema from "~/gen/energy.schema"
import type { Modifier } from "~/lib/fp-tools"
import type { JsonObj } from "~/lib/json"
import {
  assignToJsonFile,
  getDirectoryJsonArr,
  getDirectoryJsonEntries,
} from "~/lib/node/json-fs.server"

const { log } = console

export type Identified = { id: string }

export const hasId: Refinement<unknown, Identified> = (
  input
): input is Identified =>
  typeof input === `object` &&
  input !== null &&
  typeof (input as Identified)[`id`] === `string`

export const identify = (input: unknown): { id: string } => {
  if (hasId(input)) return input
  throw new Error(`${input} could not be identified`)
}

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

export type SaveJsonListenEvents = Record<
  `indexRead_${string}`,
  (vars: JsonObj) => void
> & {
  read: (vars: { type: string; id: string }) => void
  write: (vars: { type: string; id: string; value: unknown }) => void
  indexRead: (vars: { type: string }) => void
  indexWrite: (vars: { type: string; value: string[] }) => void
}
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

      socket.on(`indexRead`, ({ type }) => {
        log(socket.id, `indexRead`, type)
        const ids = index(type)
        console.log({ ids })
        socket.emit(`indexRead_${type}`, ids)
      })

      socket.on(`indexWrite`, ({ type, value: newIds }) => {
        log(socket.id, `indexWrite`, type)
        const ids = index(type)
        const toBeDeleted = ids.filter((id) => !newIds.includes(id))
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
