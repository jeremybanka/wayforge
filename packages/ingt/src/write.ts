import { readdirSync, renameSync } from "node:fs"

import type { Json } from "atom.io/json"

import type { FilestoreOptions } from "./options"
import type { ReadIndex } from "./read"

export type { WriteRelations } from "./relations"
export { initRelationsWriter } from "./relations"
export type { WriteResource } from "./resources"
export { initResourceWriter } from "./resources"

export type WriteIndexOptions = {
	type: string
	value: Json.Array<string>
}
export type WriteIndex = (options: WriteIndexOptions) => void

export const initIndexWriter = (
	{ baseDir, logger }: FilestoreOptions,
	readIndex: ReadIndex,
): WriteIndex => {
	const writeIndex: WriteIndex = ({ type, value: newIds }) => {
		const result = readIndex({ type })
		if (result instanceof Error) {
			return result
		}
		const toBeDeleted = result.filter((id) => !newIds.includes(id))
		logger.info(`⚠️`, { newIds, toBeDeleted })
		const fileNames = readdirSync(`${baseDir}/${type}`)
		for (const id of toBeDeleted) {
			const fileName = fileNames.find((name) => name.includes(id))
			renameSync(
				`${baseDir}/${type}/${fileName}`,
				`${baseDir}/${type}/_trash/${fileName}`,
			)
		}
	}
	return writeIndex
}
