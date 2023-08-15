import type { Encapsulate } from "~/packages/anvl/src/function"
import type { Json } from "~/packages/anvl/src/json"

import type {
	InitResource,
	ReadIndex,
	ReadRelations,
	ReadResource,
	ReadSchema,
	WriteIndex,
	WriteRelations,
	WriteResource,
} from "../../ingt/src"

/* prettier-ignore */
// server "on" / client "emit"
export type FilestoreClientEvents = {
	read: Encapsulate<ReadResource>
	write: Encapsulate<WriteResource>
	indexRead: Encapsulate<ReadIndex>
	indexWrite: Encapsulate<WriteIndex>
	relationsRead: Encapsulate<ReadRelations>
	relationsWrite: Encapsulate<WriteRelations>
	schemaRead: Encapsulate<ReadSchema>
	initType: Encapsulate<InitResource>
}
/* prettier-ignore */
// server "emit" / client "on"
export type FilestoreServerEvents = Record<
	`indexRead_${string}`,
	(ids: Json.Array<string>) => void
> &
	Record<`read_${string}`, (resource: Json.Serializable) => void> &
	Record<`relationsRead_${string}`, (relations: Json.Serializable) => void> &
	Record<`scan_${string}`, (contents: Json.Array<string>) => void> &
	Record<`schemaRead_${string}`, (schema: Json.Serializable) => void> & {
		event: (message: string) => void
		error_filestore: (message: string) => void
	}

export type FilestoreClusterEvents = Record<keyof any, unknown>
