import { readFileSync } from "fs"

import type { Identified } from "~/packages/anvl/src/id/identified"
import { identify } from "~/packages/anvl/src/id/identified"
import type { Json, JsonArr } from "~/packages/anvl/src/json"
import { parseJson } from "~/packages/anvl/src/json"

import { getDirectoryJsonArr } from "./utils.node"
import type { JsonStoreOptions } from "../core"

export class NotFoundError extends Error {
  public constructor(message: string) {
    super(message)
    this.name = `NotFound`
  }
}
export class BadRequestError extends Error {
  public constructor(message: string) {
    super(message)
    this.name = `BadRequest`
  }
}

export type ReadResourceOptions = { type: string; id: string }
export type ReadResource = (
  options: ReadResourceOptions
) => Identified | NotFoundError

export const initReader = ({ baseDir }: JsonStoreOptions): ReadResource => {
  const readResource = ({ id, type }) => {
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

export type ReadIndexOptions = { type: string }
export type ReadIndex = (options: ReadIndexOptions) => Error | JsonArr<string>

export const initIndexer = ({
  baseDir,
  logger,
}: JsonStoreOptions): ReadIndex => {
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

export type ReadRelations = (
  options: ReadResourceOptions
) => Json | NotFoundError

export type RelationType = `${string}_${string}`

const isRelationType = (input: unknown): input is RelationType =>
  typeof input === `string` && input.length > 2 && input.split(`_`).length === 2

export const initRelationReader = ({
  logger,
  baseDir,
}: JsonStoreOptions): ReadRelations => {
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

export type ReadSchemaOptions = { type: string }
export type ReadSchema = (options: ReadSchemaOptions) => Error | Json

export const initSchemaReader = ({
  baseDir,
  logger,
}: JsonStoreOptions): ReadSchema => {
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
