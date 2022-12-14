import type { Json } from "~/packages/anvl/src/json"

import type { ErrorObject } from "./errors"
import type { Resource, ResourceObject, ResourceUpdate } from "./resource"

export type JsonApiObject = {
  version: string
  meta?: Json
}

export type Link = {
  href: string
  meta: Json
}

export type Links = Record<string, Link | string>

export type JsonApiDocument_Error<
  ERROR extends ErrorObject | undefined = undefined,
  META extends Json | undefined = undefined
> = {
  errors: ERROR extends ErrorObject ? ERROR[] : ErrorObject[]
  meta?: META
  data?: never
  included?: never
}

export type JsonApiDocument_Happy<
  RESOURCE extends Resource,
  META extends Json | undefined = undefined,
  DATA extends Resource | Resource[] = RESOURCE
> = {
  data: DATA extends RESOURCE[]
    ? ResourceObject<RESOURCE>[]
    : ResourceObject<RESOURCE>
  meta?: META
  included?: ResourceObject<Resource>[]
  errors?: never
}

export type JsonApiDocument_Required<
  DATA extends Resource | Resource[],
  META extends Json | undefined = undefined,
  ERROR extends ErrorObject | undefined = undefined,
  RESOURCE extends Resource = DATA extends Resource[] ? DATA[number] : DATA
> =
  | JsonApiDocument_Error<ERROR, META>
  | JsonApiDocument_Happy<RESOURCE, META, DATA>

export type JsonApiDocument_Optional = {
  jsonapi?: JsonApiObject
  links?: Links
}

/* prettier-ignore */
export type JsonApiDocument<
  DATA extends Resource | Resource[],
  META extends Json | undefined = undefined,
  ERROR extends ErrorObject | undefined = undefined,
> 
= JsonApiDocument_Optional 
& JsonApiDocument_Required<
    DATA,
    META,
    ERROR
  >
/* prettier-ignore-end */

export type JsonApiUpdate<RESOURCE extends Resource> = {
  data: ResourceUpdate<RESOURCE>
}
