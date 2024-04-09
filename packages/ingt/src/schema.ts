import { readFileSync } from "node:fs"

import type { Json } from "~/packages/anvl/src/json"
import { parseJson } from "~/packages/anvl/src/json"

import type { FilestoreOptions } from "./options"
export type { ReadRelations } from "./relations"
export { initRelationReader } from "./relations"
export type { ReadResource } from "./resources"
export { initResourceReader } from "./resources"

export type ReadSchemaOptions = { type: string }
export type ReadSchema = (
	options: ReadSchemaOptions,
) => Error | Json.Serializable

export const initSchemaReader = ({
	baseDir,
	logger,
}: FilestoreOptions): ReadSchema => {
	const readSchema = ({ type }) => {
		const dir = `${baseDir}/_schemas/${type}`
		try {
			const directory = `${baseDir}/_schemas`
			const fileName = `${directory}/${type}.schema.json`
			const fileText = readFileSync(fileName, `utf8`)
			const json = parseJson(fileText)
			return json
		} catch (caught) {
			logger.warn(`Caught reading schema for "${type}" in ${dir}`)
			if (caught instanceof Error) return caught
			throw caught
		}
	}
	return readSchema
}
