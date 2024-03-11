import type { Json } from "../json"
import { filterProperties } from "../object"
import type { EmptyObject, PlainObject } from "../object"

import { cannotExist, isWithin } from "../refinement"
import type {
	JsonApiResource,
	Resource,
	ResourceFlat,
	ResourceObject,
} from "./resource"

export * from "./resource"
export * from "./errors"
export * from "./document"

const filterOutIdentifier = filterProperties(
	cannotExist,
	isWithin([`id`, `type`] as const),
)

export type Empty = Record<string, never>

// https://docs.microsoft.com/en-us/javascript/api/@azure/keyvault-certificates/requireatleastone?view=azure-node-latest
export type RequireAtLeastOne<T> = {
	[K in keyof T]-?: Partial<Pick<T, Exclude<keyof T, K>>> & Required<Pick<T, K>>
}[keyof T]

export type DeleteKeysFrom<T, K extends number | string | symbol> = T & {
	[P in K]?: never
}

export const flattenResourceObject = <RESOURCE extends JsonApiResource>(
	resource: ResourceObject<RESOURCE>,
): ResourceFlat<RESOURCE> => {
	return {
		...resource.attributes,
		...resource.relationships,
		id: resource.id,
		type: resource.type,
	} as ResourceFlat<RESOURCE>
}
export const serializeResource = <ATTRIBUTES extends Json.Object & PlainObject>(
	obj: ATTRIBUTES,
	type: string,
	id: string,
): ResourceObject<Resource<ATTRIBUTES, EmptyObject>> => ({
	attributes: filterOutIdentifier(obj),
	type,
	id,
})

// export const deserialize = <
//   DATA extends ResourceObject<Resource> | ResourceObject<Resource>[]
//   // RELATED_DICT extends Record<string, Model>,
//   // RELATED_MODELS extends ResourceObject<RELATED_DICT[keyof RELATED_DICT]>
// >(
//   doc: JsonApiDocument<DATA>
// ): RESOURCE[] => {
//   if (doc.data) {
//     if (Array.isArray(doc.data)) return doc.data.map(unpackResource)
//     return [unpackResource(doc.data)]
//   }
//   console.warn(doc.errors)

//   throw new Error(doc.errors?.[0]?.detail ?? `Invalid document`)
// }
