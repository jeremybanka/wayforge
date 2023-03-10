import { readdirSync, renameSync, writeFileSync } from "fs"

import { identity, pipe } from "fp-ts/function"
import { isString } from "fp-ts/string"

import type { Json, JsonArr } from "~/packages/anvl/src/json"
import { hasExactProperties } from "~/packages/anvl/src/object/refinement"

import type { JsonStoreOptions } from "."
import type { ReadIndex } from "./read"

export type WriteResourceOptions = { type: string; id: string; value: Json }
export type WriteResource = (options: WriteResourceOptions) => void

export const initWriter = ({
  formatResource = identity,
  baseDir,
}: JsonStoreOptions): WriteResource => {
  const writeResource: WriteResource = ({ id, type, value }) => {
    const formatted = pipe(value, JSON.stringify, formatResource)
    const name =
      (hasExactProperties({ name: isString })(value) ? `${value.name}_` : ``) +
      id
    const nextFilepath = `${baseDir}/${type}/${name}.json`
    const allFileNames = readdirSync(`${baseDir}/${type}`)
    const prevFileName = allFileNames.find((name) => name.includes(id))
    const prevFilePath = `${baseDir}/${type}/${prevFileName}`
    if (prevFileName && prevFilePath !== nextFilepath) {
      renameSync(prevFilePath, nextFilepath)
    }
    writeFileSync(nextFilepath, formatted)
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
    const result = readIndex({ type })
    if (result instanceof Error) {
      return result
    }
    const toBeDeleted = result.filter((id) => !newIds.includes(id))
    logger.info(`⚠️`, { newIds, toBeDeleted })
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
  formatResource = identity,
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
