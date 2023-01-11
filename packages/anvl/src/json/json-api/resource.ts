import type { Refinement } from "fp-ts/lib/Refinement"
import { isString } from "fp-ts/lib/string"

import type { Json, JsonObj } from "~/packages/anvl/src/json"
import { hasProperties } from "~/packages/anvl/src/object"

import type { RequireAtLeastOne } from "."
import { ifDefined } from "../../nullish"
import { isJson } from "../refine"
import type { Link, Links } from "./document"

export type Relationships = Record<
  string,
  {
    data: Resource | Resource[]
    links?: RelationshipLinks
    meta?: Json
  }
>

export type Resource = {
  id: string
  type: string
  attributes: JsonObj
  relationships: Relationships
}

export type RelationshipLinks = Links &
  RequireAtLeastOne<{
    self: Link | string
    related: Link | string
  }>

export type ResourceIdentifierObject<
  RESOURCE extends Resource = Resource,
  META extends Json | undefined = undefined
> = {
  id: RESOURCE[`id`]
  type: RESOURCE[`type`]
  meta?: META
}

export const isResourceIdentifier = Object.assign(
  (thing: unknown): thing is ResourceIdentifierObject =>
    hasProperties({
      id: isString,
      type: isString,
      meta: ifDefined(isJson),
    })(thing),
  {
    whoseMeta:
      <META extends Json | undefined>(
        isMeta: Refinement<unknown, META>
      ): Refinement<unknown, ResourceIdentifierObject<Resource, META>> =>
      (thing: unknown): thing is ResourceIdentifierObject<Resource, META> =>
        isResourceIdentifier(thing) && isMeta(thing.meta),
  }
)

export type Identifier<
  RESOURCE extends Resource = Resource,
  META extends Json | undefined = undefined
> = ResourceIdentifierObject<RESOURCE, META>

export type Relationship<
  RESOURCE extends Resource = Resource,
  META extends Json | undefined = undefined,
  LINKS extends RelationshipLinks | undefined = undefined
> = RequireAtLeastOne<{
  links: LINKS
  data: Identifier<RESOURCE>
  meta: META
}>

export type Linkages<RELATIONSHIPS extends Relationships> = {
  [K in keyof RELATIONSHIPS]: RELATIONSHIPS[K][`data`] extends Resource[]
    ? Relationship<
        RELATIONSHIPS[K][`data`][number],
        RELATIONSHIPS[K][`meta`],
        RELATIONSHIPS[K][`links`]
      >[]
    : RELATIONSHIPS[K][`data`] extends Resource
    ? Relationship<
        RELATIONSHIPS[K][`data`],
        RELATIONSHIPS[K][`meta`],
        RELATIONSHIPS[K][`links`]
      >
    : never
}

export type JsonApiResource = Resource

export type ResourceObject<RESOURCE extends Resource> = {
  id: RESOURCE[`id`]
  type: RESOURCE[`type`]
  attributes: Omit<RESOURCE[`attributes`], `id` | `type`> // non-optional in this implementation
  relationships?: Linkages<RESOURCE[`relationships`]>
  links?: Links
}
export type RO<RESOURCE extends Resource> = ResourceObject<RESOURCE>
//_____________//
// Why
// is [attributes]
// optional
// in a resource object?
//¯¯¯¯¯¯¯¯¯¯¯¯¯//

export type ResourceUpdate<RESOURCE extends Resource> = {
  id: RESOURCE[`id`]
  type: RESOURCE[`type`]
  attributes?: Partial<Omit<RESOURCE[`attributes`], `id` | `type`>>
  relationships?: Partial<Linkages<RESOURCE[`relationships`]>>
}

export type RelationshipUpdate<DATA extends Resource | Resource[]> = {
  data: DATA extends Resource[]
    ? ResourceIdentifierObject<DATA[number]>[]
    : DATA extends Resource
    ? ResourceIdentifierObject<DATA>
    : never
}

export type ResourceFlat<RESOURCE extends Resource> = RESOURCE &
  RESOURCE[`relationships`]
