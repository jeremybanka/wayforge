import { readdirSync, readFileSync } from "fs"

import type { Entries } from "../fp-tools/object"
import { entriesToRecord } from "../fp-tools/object"
import type { Json } from "../json"
import { parseJson } from "../json"

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
