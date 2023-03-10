import type { PathLike } from "fs"
import { mkdirSync, readdirSync, renameSync, writeFileSync } from "fs"

import { identity, pipe } from "fp-ts/function"
import { isString } from "fp-ts/string"

import type { Json, JsonArr } from "~/packages/anvl/src/json"
import { doesExtend } from "~/packages/anvl/src/object/refinement"

import type { FilestoreOptions } from "./json-filestore"
import type { ReadIndex } from "./read"

const readDirectory = (dir: PathLike): Error | JsonArr<string> => {
  try {
    const files = readdirSync(dir)
    return files
  } catch (caught) {
    if (caught instanceof Error) return caught
    throw caught
  }
}

type ScanResult = Record<`/${string}`, JsonArr<string>>
type Scan = (...paths: PathLike[]) => Error | ScanResult

export const initScanner = ({ baseDir }: FilestoreOptions): Scan => {
  const scan: Scan = (...paths: PathLike[]): Error | ScanResult => {
    try {
      return paths.reduce<ScanResult>((acc, path) => {
        const files = readDirectory(baseDir + path)
        if (files instanceof Error) throw files
        return { ...acc, [String(path)]: files }
      }, {})
    } catch (caught) {
      if (caught instanceof Error) return caught
      throw caught
    }
  }
  return scan
}

export type WriteResourceOptions = { type: string; id: string; value: Json }
export type WriteResource = (
  options: WriteResourceOptions
) => Promise<Error | void>

export const initWriter = ({
  formatResource = identity,
  baseDir,
}: FilestoreOptions): WriteResource => {
  const writeResource: WriteResource = async ({ id, type, value }) => {
    const formatted = pipe(value, JSON.stringify, formatResource)
    const hasName = doesExtend({ name: isString })
    const name = (hasName(value) ? `${value.name}_` : ``) + id
    const nextFilepath = `${baseDir}/${type}/${name}.json`
    const allFileNames = readDirectory(`${baseDir}/${type}`)
    console.log({ allFileNames })
    if (allFileNames instanceof Error) {
      return allFileNames
    }
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
  { baseDir, logger }: FilestoreOptions,
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
}: FilestoreOptions): WriteRelations => {
  const writeRelations: WriteRelations = ({ id, type, value }) => {
    const valueAsString = JSON.stringify(value)
    const formatted = formatResource(valueAsString)
    const newFilePath = `${type}/${id}.json`
    writeFileSync(`${baseDir}/_relations/${newFilePath}`, formatted)
  }
  return writeRelations
}

export type InitType = (type: string) => Error | ScanResult

export const initResourceTypeInitializer = ({
  baseDir,
  logger,
}: FilestoreOptions): InitType => {
  const initType: InitType = (type) => {
    const readDirectoryResult = readDirectory(baseDir)
    if (readDirectoryResult instanceof Error) {
      return readDirectoryResult
    }
    const typeExists = readDirectoryResult.includes(type)
    if (typeExists) {
      return Error(
        `Tried to initialize type "${type}" but a folder with that name already exists in "${baseDir}"`
      )
    }
    mkdirSync(`${baseDir}/${type}`)
    writeFileSync(`${baseDir}/${type}/.gitkeep`, ``)
    const scan = initScanner({ baseDir, logger })
    return scan(`/`, `/${type}`)
  }
  return initType
}
