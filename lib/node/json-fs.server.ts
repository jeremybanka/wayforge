import { readdirSync, readFileSync, writeFileSync } from "fs"

import type { Json, JsonObj } from "anvl/json"
import { parseJson } from "anvl/json"
import { isResourceIdentifier } from "anvl/json/json-api"
import type { ResourceIdentifierObject } from "anvl/json/json-api"
import { refineJsonType } from "anvl/json/refine"
import { entriesToRecord, isPlainObject } from "anvl/object"
import type { Entries } from "anvl/object"
import { sprawl } from "anvl/object/sprawl"
import { isString } from "fp-ts/lib/string"

export const getJsonFileNames = (dir: string): string[] => {
  const fileNames = readdirSync(dir)
  const jsonFileNames = fileNames.filter((fileName) =>
    fileName.endsWith(`.json`)
  )
  return jsonFileNames
}

export type GetJsonFromDirectoryOptions<T> = {
  dir: string
  coerce: (json: Json) => T
  suppressWarnings?: boolean
}

export const getDirectoryJsonEntries = <T>({
  dir,
  coerce,
  suppressWarnings = false,
}: GetJsonFromDirectoryOptions<T>): Entries<string, T> =>
  getJsonFileNames(dir)
    .map((fileName): [string, string] => [
      fileName,
      readFileSync(`${dir}/${fileName}`, `utf8`),
    ])
    .map(([fileName, fileContents]) => {
      let json: Json | undefined = undefined
      let content: T | undefined = undefined
      try {
        json = parseJson(fileContents) as Json
      } catch (error) {
        if (!suppressWarnings) {
          console.warn(
            `The file ${fileName} in the directory ${dir} is not valid JSON.`
          )
        }
      }
      if (json !== undefined) {
        try {
          content = coerce(json)
        } catch (error) {
          if (!suppressWarnings) {
            console.warn(
              `The file ${fileName} in the directory ${dir} does not match the expected type.`
            )
          }
        }
      }
      return [fileName, content]
    })
    .filter(([, parsed]) => parsed !== undefined) as [string, T][]

export const getDirectoryJsonObj = <T>({
  dir,
  coerce,
  suppressWarnings = false,
}: GetJsonFromDirectoryOptions<T>): Record<string, T> =>
  entriesToRecord(
    getDirectoryJsonEntries({
      dir,
      coerce,
      suppressWarnings,
    })
  )

export const getDirectoryJsonArr = <T>({
  dir,
  coerce,
  suppressWarnings = false,
}: GetJsonFromDirectoryOptions<T>): T[] =>
  getDirectoryJsonEntries({
    dir,
    coerce,
    suppressWarnings,
  }).map(([, content]) => content)

export type AssignToJsonFileOptions = {
  path: string
  properties: JsonObj
}

export const assignToJsonFile = ({
  path,
  properties,
}: AssignToJsonFileOptions): void => {
  const fileContents = readFileSync(path, `utf8`)
  const content = parseJson(fileContents)
  const json = refineJsonType(content)
  if (json.type !== `object`) {
    throw new Error(`The file ${path} does not hold a JSON object.`)
  }
  const newJson = { ...json.data, ...properties }
  const newFileContents = JSON.stringify(newJson, null, 2)
  writeFileSync(path, newFileContents)
}

export type PriorRelation = {
  to: ResourceIdentifierObject
  path: string
  meta?: Json
}

export const extractPriorRelations = <T extends JsonObj>(
  toRemove: ResourceIdentifierObject,
  data: T
): { data: T; priorRelations: PriorRelation[] } => {
  if (!isString(data.id) || !isString(data.type)) {
    throw new Error(`The data does not hold a resource identifier.`)
  }
  const dataIdentifier: ResourceIdentifierObject = {
    id: data.id,
    type: data.type,
  }
  const priorRelations: PriorRelation[] = []
  const cleanup: string[] = []
  sprawl(data, (path, value) => {
    if (isResourceIdentifier(value)) {
      if (value.id === toRemove.id) {
        const priorRelation: PriorRelation = {
          to: dataIdentifier,
          path,
        }
        if (value.meta) priorRelation.meta = value.meta
        priorRelations.push(priorRelation)
        cleanup.push(path)
      }
    }
  })
  const dataDeepCopy = parseJson(JSON.stringify(data)) as T
  const newData = cleanup.reduce<T>((memo, path) => {
    const dataCopy = { ...memo }
    const parentPath = path.slice(0, path.lastIndexOf(`/`))
    const parent = parentPath
      .split(`/`)
      .reduce((memo, key) => (key === `` ? memo : memo[key]), dataCopy)
    if (Array.isArray(parent)) {
      const index = parseInt(path.slice(path.lastIndexOf(`/`) + 1))
      parent.splice(index, 1)
    }
    if (isPlainObject(parent)) {
      const key = path.slice(path.lastIndexOf(`/`) + 1)
      delete (parent as Record<string, any>)[key]
    }
    return dataCopy
  }, dataDeepCopy)
  return { data: newData, priorRelations }
}
