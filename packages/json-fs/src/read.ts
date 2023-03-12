import { identify } from "~/packages/anvl/src/id/identified"
import type { JsonArr } from "~/packages/anvl/src/json"

import type { FilestoreOptions } from "./options"
import { getDirectoryJsonArr } from "./utils"
export { initRelationReader, ReadRelations } from "./relations"
export { initResourceReader, ReadResource } from "./resources"

export type ReadIndexOptions = { type: string }
export type ReadIndex = (options: ReadIndexOptions) => Error | JsonArr<string>

export const initIndexer = ({
  baseDir,
  logger,
}: FilestoreOptions): ReadIndex => {
  const readIndex: ReadIndex = ({ type }) => {
    const directory = `${baseDir}/${type}`
    try {
      const jsonContents = getDirectoryJsonArr({
        dir: directory,
        coerce: identify,
      })
      const ids = jsonContents.map((data) => data.id)
      return ids
    } catch (caught) {
      logger.warn(`Error reading index for "${type}" in ${directory}`)
      if (caught instanceof Error) return caught
      throw caught
    }
  }
  return readIndex
}
