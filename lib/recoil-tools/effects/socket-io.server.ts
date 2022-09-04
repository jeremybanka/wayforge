import fs from "fs"

import type { Socket, ServerOptions } from "socket.io"
import { Server as WebSocketServer } from "socket.io"
import type { EventsMap } from "socket.io/dist/typed-events"
import type { SomeZodObject, ZodObject } from "zod"

import energySchema from "~/gen/energy.schema"
import type { Modifier } from "~/lib/fp-tools"
import { getDirectoryJsonEntries } from "~/lib/fs"
import type { JsonObj } from "~/lib/json"

const { log } = console

export const types = ``

const index = (type: string): string[] => {
  const dir = `./projects/wayfarer/${type}`
  const entries = getDirectoryJsonEntries({
    dir,
    refine: (json) => energySchema.parse(json),
  })
  const fileContents = entries.map(([, data]) => data.id)
  return fileContents
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

// export const io =
// })

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
  new WebSocketServer(port, {
    cors: {
      origin: `http://localhost:5173`,
      methods: [`GET`, `POST`],
    },
  }).on(
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

      socket.on(`read`, ({ id, type }) => {
        log(socket.id, `read`, id, type)
        const dir = `${jsonRoot}/${type}`
        const entries = getDirectoryJsonEntries({
          dir,
          refine: (json) => energySchema.parse(json),
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
        const allFileNames = fs.readdirSync(`${jsonRoot}/${type}`)
        const prevFilePath =
          type + `/` + allFileNames.find((fileName) => fileName.includes(id))
        if (prevFilePath && prevFilePath !== newFilePath) {
          fs.renameSync(
            `${jsonRoot}/${prevFilePath}`,
            `${jsonRoot}/${newFilePath}`
          )
        }
        fs.writeFileSync(`${jsonRoot}/${newFilePath}`, formatted)
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
        const fileNames = fs.readdirSync(`${jsonRoot}/${type}`)

        toBeDeleted.forEach((id) => {
          const fileName = fileNames.find((name) => name.includes(id))
          fs.renameSync(
            `${jsonRoot}/${type}/${fileName}`,
            `${jsonRoot}/${type}/_trash/${fileName}`
          )
        })
      })
    }
  )

// export const saveJson =
//   <TypeMap extends Record<string, SomeZodObject>>() =>
//   (socket: Socket): void => {}
