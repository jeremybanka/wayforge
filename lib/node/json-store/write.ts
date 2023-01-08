import { readdirSync, renameSync, writeFileSync } from "fs"

import { pipe } from "fp-ts/function"
import { isString } from "fp-ts/string"

import type { Json, JsonArr, JsonObj } from "~/packages/Anvil/src/json"
import { hasProperties } from "~/packages/Anvil/src/object"

import type { JsonStoreOptions } from "."
import type { ReadIndex } from "./read"

export type WriteResourceOptions = { type: string; id: string; value: Json }
export type WriteResource = (options: WriteResourceOptions) => void

export const initWriter = ({
  formatResource,
  baseDir,
}: JsonStoreOptions): WriteResource => {
  const writeResource: WriteResource = ({ id, type, value }) => {
    const formatted = pipe(value, JSON.stringify, formatResource)
    const filename =
      (hasProperties({ name: isString })(value) ? `${value.name}_` : ``) + id
    const nextFilepath = `${type}/${baseDir}/${filename}.json`
    const allFileNames = readdirSync(`${baseDir}/${type}`)
    const prevFileName = allFileNames.find((name) => name.includes(id))
    const prevFilePath = type + `/` + prevFileName
    if (prevFileName && prevFilePath !== nextFilepath) {
      renameSync(`${baseDir}/${prevFilePath}`, `${baseDir}/${nextFilepath}`)
    }
    writeFileSync(`${baseDir}/${nextFilepath}`, formatted)
  }
  return writeResource
}

export type WriteIndexOptions = {
  type: string
  value: JsonArr<string>
}
export type WriteIndex = (options: WriteIndexOptions) => void

export const initIndexWriter = (
  { baseDir, logger }: JsonStoreOptions,
  readIndex: ReadIndex
): WriteIndex => {
  const writeIndex: WriteIndex = ({ type, value: newIds }) => {
    const ids = readIndex({ type })
    if (ids instanceof Error) {
      console.error(ids)
      return
    }
    const toBeDeleted = ids.filter((id) => !newIds.includes(id))
    console.log(`⚠️`, { newIds, toBeDeleted })
    const fileNames = readdirSync(`${baseDir}/${type}`)

    toBeDeleted.forEach((id) => {
      const fileName = fileNames.find((name) => name.includes(id))
      renameSync(
        `${baseDir}/${type}/${fileName}`,
        `${baseDir}/${type}/_trash/${fileName}`
      )
    })
  }
  return writeIndex
}

export type WriteRelationsOptions = {
  type: string
  id: string
  value: Json
}
export type WriteRelations = (options: WriteRelationsOptions) => void

export const initRelationsWriter = ({
  formatResource,
  baseDir,
}: JsonStoreOptions): WriteRelations => {
  const writeRelations: WriteRelations = ({ id, type, value }) => {
    const valueAsString = JSON.stringify(value)
    const formatted = formatResource(valueAsString)
    const newFilePath = `${type}/${id}.json`
    writeFileSync(`${baseDir}/_relations/${newFilePath}`, formatted)
  }
  return writeRelations
}
