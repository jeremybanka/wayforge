import { isString } from "fp-ts/string"

import type { Json, JsonObj } from "~/packages/anvl/src/json"

import { isArray } from "../array"
import { hasExactProperties, isRecord } from "../object/refinement"
import { isLiteral } from "../refinement"

export const RELATION_TYPES = [`1:1`, `1:n`, `n:n`] as const

export type RelationType = (typeof RELATION_TYPES)[number]

export const isRelationType = (x: unknown): x is RelationType =>
  RELATION_TYPES.includes(x as RelationType)

export type RelationData<
  CONTENT extends JsonObj | null = null,
  A extends string = `from`,
  B extends string = `to`
> = {
  contents: JsonObj<string, CONTENT>
  relations: JsonObj<string, string[]>
  relationType: RelationType
  a: A
  b: B
}

export const EMPTY_RELATION_DATA: RelationData = {
  contents: {},
  relations: {},
  relationType: `n:n`,
  a: `from`,
  b: `to`,
}

export const isRelationData =
  <
    CONTENT extends JsonObj | null = null,
    A extends string = `from`,
    B extends string = `to`
  >(
    isContent?: (json: Json) => json is CONTENT,
    a: A = `from` as A,
    b: B = `to` as B
  ) =>
  (input: unknown): input is RelationData<CONTENT> =>
    hasExactProperties<RelationData<CONTENT>>({
      contents: isContent
        ? isRecord(isString, isContent)
        : hasExactProperties({}),
      relations: isRecord(isString, isArray(isString)),
      relationType: isRelationType,
      a: isLiteral(a as `from`),
      b: isLiteral(b as `to`),
    })(input)
