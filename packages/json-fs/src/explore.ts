import type { PathLike } from "fs"
import { readdirSync } from "fs"

import type { JsonArr } from "~/packages/anvl/src/json"

import type { FilestoreOptions } from "./options"

export const readDirectory = (dir: PathLike): Error | JsonArr<string> => {
  try {
    const files = readdirSync(dir)
    return files
  } catch (caught) {
    if (caught instanceof Error) return caught
    throw caught
  }
}

export type ScanResult = Record<`/${string}`, JsonArr<string>>
export type Scan = (...paths: PathLike[]) => Error | ScanResult

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
