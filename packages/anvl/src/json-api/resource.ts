import type { RequireAtLeastOne } from "."
import type { Link, Links } from "./document"

import type { Json } from "../json"
import { ifDefined } from "../nullish"
import type { EmptyObject, PlainObject } from "../object"
import { hasExactProperties } from "../object"
import { isString } from "../primitive"
import type { Refinement } from "../refinement"

import { isJson } from "../refinement/refine-json"

export type Relationships = Record<
	string,
	{
		data: JsonApiResource | JsonApiResource[]
		links?: RelationshipLinks
		meta?: Json.Serializable
	}
>

export type Resource<
	ATTRIBUTES extends PlainObject,
	RELATIONS extends Relationships,
> = {
	attributes: ATTRIBUTES
	relationships: RELATIONS
} & {
	id: string
	type: string
}

export type RelationshipLinks = Links &
	RequireAtLeastOne<{
		self: Link | string
		related: Link | string
	}>

export type ResourceIdentifierObject<
	RESOURCE extends JsonApiResource,
	META extends Json.Serializable | undefined = undefined,
> = {
	id: RESOURCE[`id`]
	type: RESOURCE[`type`]
	meta?: META
}

export const isResourceIdentifier = Object.assign(
	(thing: unknown): thing is ResourceIdentifierObject<any, any> =>
		hasExactProperties({
			id: isString,
			type: isString,
			meta: ifDefined(isJson),
		})(thing),
	{
		whoseMeta:
			<META extends Json.Serializable | undefined>(
			isMeta: Refinement<unknown, META>,
		): Refinement<unknown, ResourceIdentifierObject<any, META>> =>
			(thing: unknown): thing is ResourceIdentifierObject<any, META> =>
				isResourceIdentifier(thing) && isMeta(thing.meta),
	},
)

export type Identifier<
	RESOURCE extends JsonApiResource,
	META extends Json.Serializable | undefined = undefined,
> = ResourceIdentifierObject<RESOURCE, META>

export type Relationship<
	RESOURCE extends JsonApiResource,
	META extends Json.Serializable | undefined = undefined,
	LINKS extends RelationshipLinks | undefined = undefined,
> = RequireAtLeastOne<{
	links: LINKS
	data: Identifier<RESOURCE>
	meta: META
}>

export type Linkages<RELATIONSHIPS extends Relationships> = {
	[K in keyof RELATIONSHIPS]: RELATIONSHIPS[K][`data`] extends JsonApiResource[]
		? Relationship<
				RELATIONSHIPS[K][`data`][number],
				RELATIONSHIPS[K][`meta`],
				RELATIONSHIPS[K][`links`]
		  >[]
		: RELATIONSHIPS[K][`data`] extends JsonApiResource
		  ? Relationship<
					RELATIONSHIPS[K][`data`],
					RELATIONSHIPS[K][`meta`],
					RELATIONSHIPS[K][`links`]
			  >
		  : never
}

export type JsonApiResource<
	ATR extends PlainObject = PlainObject,
	REL extends Relationships = EmptyObject,
> = Resource<ATR, REL>

export type ResourceObject<RESOURCE extends JsonApiResource> = {
	id: RESOURCE[`id`]
	type: RESOURCE[`type`]
	attributes: Omit<RESOURCE[`attributes`], `id` | `type`> // non-optional in this implementation
	relationships?: Linkages<RESOURCE[`relationships`]>
	links?: Links
}
export type RO<RESOURCE extends JsonApiResource> = ResourceObject<RESOURCE>

export type ResourceAttributes<RESOURCE extends JsonApiResource> =
	ResourceObject<RESOURCE>[`attributes`]

export type ResourceUpdate<RESOURCE extends JsonApiResource> = {
	id: RESOURCE[`id`]
	type: RESOURCE[`type`]
	attributes?: Partial<Omit<RESOURCE[`attributes`], `id` | `type`>>
	relationships?: Partial<Linkages<RESOURCE[`relationships`]>>
}

export type RelationshipUpdate<
	DATA extends JsonApiResource | JsonApiResource[],
> = {
	data: DATA extends JsonApiResource[]
		? ResourceIdentifierObject<DATA[number]>[]
		: DATA extends JsonApiResource
		  ? ResourceIdentifierObject<DATA>
		  : never
}

export type ResourceFlat<RESOURCE extends JsonApiResource> = RESOURCE &
	RESOURCE[`relationships`]
