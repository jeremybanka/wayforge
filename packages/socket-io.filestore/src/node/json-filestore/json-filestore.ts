import { identity } from "fp-ts/function"

import type {
  ReadIndex,
  ReadRelations,
  ReadResource,
  ReadSchema,
  WriteIndex,
  WriteRelations,
  WriteResource,
} from ".."
import {
  initIndexWriter,
  initRelationsWriter,
  initWriter,
  initSchemaReader,
  initIndexer,
  initRelationReader,
  initReader,
} from ".."

export type FilestoreOptions = {
  formatResource?: (unformatted: string) => string
  baseDir: string
  logger: Pick<Console, `error` | `info` | `warn`>
}

export const DEFAULT_FILESTORE_OPTIONS: FilestoreOptions = {
  formatResource: identity,
  baseDir: `json`,
  logger: console,
}

export class ReadonlyFilestore {
  public constructor(options: FilestoreOptions) {
    this.read = initReader(options)
    this.readIndex = initIndexer(options)
    this.readRelations = initRelationReader(options)
    this.readSchema = initSchemaReader(options)
  }
  public read: ReadResource
  public readIndex: ReadIndex
  public readRelations: ReadRelations
  public readSchema: ReadSchema
}

export class Filestore extends ReadonlyFilestore {
  public constructor(options: FilestoreOptions) {
    super(options)
    this.write = initWriter(options)
    this.writeIndex = initIndexWriter(options, this.readIndex)
    this.writeRelations = initRelationsWriter(options)
  }
  public write: WriteResource
  public writeIndex: WriteIndex
  public writeRelations: WriteRelations
}
