import type { Json } from "../json"
import type { ErrorObject } from "./errors"
import type { JsonApiResource, ResourceObject, ResourceUpdate } from "./resource"

export type JsonApiObject = {
	version: string
	meta?: Json.Serializable
}

export type Link = {
	href: string
	meta: Json.Serializable
}

export type Links = Record<string, Link | string>

export type JsonApiDocument_Error<
	ERROR extends ErrorObject | undefined = undefined,
	META extends Json.Serializable | undefined = undefined,
> = {
	errors: ERROR extends ErrorObject ? ERROR[] : ErrorObject[]
	meta?: META
	data?: never
	included?: never
}

export type JsonApiDocument_Happy<
	RESOURCE extends JsonApiResource,
	META extends Json.Serializable | undefined = undefined,
	DATA extends JsonApiResource | JsonApiResource[] = RESOURCE,
> = {
	data: DATA extends RESOURCE[]
		? ResourceObject<RESOURCE>[]
		: ResourceObject<RESOURCE>
	meta?: META
	included?: ResourceObject<JsonApiResource>[]
	errors?: never
}

export type JsonApiDocument_Required<
	DATA extends JsonApiResource | JsonApiResource[],
	META extends Json.Serializable | undefined = undefined,
	ERROR extends ErrorObject | undefined = undefined,
	RESOURCE extends JsonApiResource = DATA extends JsonApiResource[]
		? DATA[number]
		: DATA,
> =
	| JsonApiDocument_Error<ERROR, META>
	| JsonApiDocument_Happy<RESOURCE, META, DATA>

export type JsonApiDocument_Optional = {
	jsonapi?: JsonApiObject
	links?: Links
}

/* prettier-ignore */
export type JsonApiDocument<
	DATA extends JsonApiResource | JsonApiResource[],
	META extends Json.Serializable | undefined = undefined,
	ERROR extends ErrorObject | undefined = undefined,
> = JsonApiDocument_Optional & JsonApiDocument_Required<DATA, META, ERROR>
/* prettier-ignore-end */

export type JsonApiUpdate<RESOURCE extends JsonApiResource> = {
	data: ResourceUpdate<RESOURCE>
}
