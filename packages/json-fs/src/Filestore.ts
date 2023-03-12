import type { FilestoreOptions } from "./options"
import type { ReadIndex, ReadRelations, ReadResource } from "./read"
import { initIndexer, initRelationReader, initResourceReader } from "./read"
import type { ReadSchema } from "./schema"
import { initSchemaReader } from "./schema"
import type { WriteIndex, WriteRelations, WriteResource } from "./write"
import {
  initIndexWriter,
  initRelationsWriter,
  initResourceWriter,
} from "./write"

export class ReadonlyFilestore {
  public constructor(options: FilestoreOptions) {
    this.readResource = initResourceReader(options)
    this.readIndex = initIndexer(options)
    this.readRelations = initRelationReader(options)
    this.readSchema = initSchemaReader(options)
  }
  public readResource: ReadResource
  public readIndex: ReadIndex
  public readRelations: ReadRelations
  public readSchema: ReadSchema
}

export class Filestore extends ReadonlyFilestore {
  public constructor(options: FilestoreOptions) {
    super(options)
    this.writeResource = initResourceWriter(options)
    this.writeIndex = initIndexWriter(options, this.readIndex)
    this.writeRelations = initRelationsWriter(options)
  }
  public writeResource: WriteResource
  public writeIndex: WriteIndex
  public writeRelations: WriteRelations
}
