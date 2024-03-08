import { readFileSync, writeFileSync } from "node:fs"

import type { Json } from "~/packages/anvl/src/json"
import { parseJson } from "~/packages/anvl/src/json"

import type { NotFoundError } from "./errors"
import { BadRequestError } from "./errors"
import type { FilestoreOptions } from "./options"
import type { ReadResourceOptions } from "./resources"

export type ReadRelations = (
	options: ReadResourceOptions,
) => Json.Serializable | NotFoundError

export type RelationType = `${string}_${string}`

const isRelationType = (input: unknown): input is RelationType =>
	typeof input === `string` && input.length > 2 && input.split(`_`).length === 2

export const initRelationReader = ({
	logger,
	baseDir,
}: FilestoreOptions): ReadRelations => {
	const readRelations: ReadRelations = ({ id, type }) => {
		const dir = `${baseDir}/_relations/${type}`
		if (isRelationType(type)) {
			try {
				const directory = `${baseDir}/_relations/${type}`
				const fileName = `${directory}/${id}.json`
				const fileText = readFileSync(fileName, `utf8`)
				const json = parseJson(fileText)
				return json
			} catch (thrown) {
				logger.warn(`Caught reading relations for "${type}" in ${dir}`)
				if (thrown instanceof Error) return thrown
			}
		}
		return new BadRequestError(`Not a relation type: ${type}`)
	}
	return readRelations
}

export type WriteRelationsOptions = {
	type: string
	id: string
	value: Json.Serializable
}
export type WriteRelations = (options: WriteRelationsOptions) => void

export const initRelationsWriter = ({
	formatResource = (unformatted) => Promise.resolve(unformatted),
	baseDir,
}: FilestoreOptions): WriteRelations => {
	const writeRelations: WriteRelations = async ({ id, type, value }) => {
		const valueAsString = JSON.stringify(value)
		const formatted = await formatResource(valueAsString)
		const newFilePath = `${type}/${id}.json`
		writeFileSync(`${baseDir}/_relations/${newFilePath}`, formatted)
	}
	return writeRelations
}
