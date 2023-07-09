import { mkdirSync, writeFileSync, renameSync } from "fs"

import { pipe } from "fp-ts/lib/function"
import { isString } from "fp-ts/lib/string"

import type { Identified } from "~/packages/anvl/src/id"
import { identify } from "~/packages/anvl/src/id"
import type { Json } from "~/packages/anvl/src/json"
import { doesExtend } from "~/packages/anvl/src/object"

import { NotFoundError } from "./errors"
import type { ScanResult } from "./explore"
import { initScanner, readDirectory } from "./explore"
import type { FilestoreOptions } from "./options"
import { getDirectoryJsonArr } from "./utils"

export type ReadResourceOptions = { type: string; id: string }
export type ReadResource = (
  options: ReadResourceOptions
) => Identified | NotFoundError

export const initResourceReader = ({
  baseDir,
}: FilestoreOptions): ReadResource => {
  const readResource: ReadResource = ({ id, type }) => {
    const dir = `${baseDir}/${type}`
    try {
      const allResources = getDirectoryJsonArr({
        dir,
        coerce: identify,
      })
      const resource = allResources.find((data) => data.id === id)
      return (
        resource ??
        new NotFoundError(`Resource not found. looked in ${dir}/ for ${id}`)
      )
    } catch (caught) {
      if (caught instanceof Error) return caught
      throw caught
    }
  }
  return readResource
}

export type InitResource = (type: string) => Error | ScanResult

export const initResourceTypeInitializer = ({
  baseDir,
  logger,
}: FilestoreOptions): InitResource => {
  const initType: InitResource = (type) => {
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

export type WriteResourceOptions = { type: string; id: string; value: Json }
export type WriteResource = (
  options: WriteResourceOptions
) => Promise<Error | void>

export const initResourceWriter = ({
  formatResource = (unformatted) => Promise.resolve(unformatted),
  baseDir,
}: FilestoreOptions): WriteResource => {
  const writeResource: WriteResource = async ({ id, type, value }) => {
    const stringified = pipe(value, JSON.stringify)
    const formatted = await formatResource(stringified)
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
