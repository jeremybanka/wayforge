import { identify } from "~/packages/anvl/src/id/identified"
import type { Json } from "~/packages/atom.io/json/src"

import type { FilestoreOptions } from "./options"
import { getDirectoryJsonArr } from "./utils"

export type { ReadRelations } from "./relations"
export { initRelationReader } from "./relations"
export type { ReadResource } from "./resources"
export { initResourceReader } from "./resources"

export type ReadIndexOptions = { type: string }
export type ReadIndex = (options: ReadIndexOptions) => Error | Json.Array<string>

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
