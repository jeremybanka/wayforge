import { isString } from "../primitive"

import type { Json } from "~/packages/anvl/src/json"

import { isArray } from "../array"
import { hasExactProperties, isRecord } from "../object/refinement"
import { isLiteral } from "../refinement"

export const RELATION_TYPES = [`1:1`, `1:n`, `n:n`] as const

export type RelationType = typeof RELATION_TYPES[number]

export const isRelationType = (x: unknown): x is RelationType =>
	RELATION_TYPES.includes(x as RelationType)

export type RelationData<
	CONTENT extends Json.Object | null = null,
	A extends string = `from`,
	B extends string = `to`,
> = {
	contents: Json.Object<string, CONTENT>
	relations: Json.Object<string, string[]>
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

export type IsRelationDataOptions<
	CONTENT extends Json.Object | null = null,
	A extends string = `from`,
	B extends string = `to`,
> = {
	from?: A
	to?: B
	isContent?: (json: Json.Serializable) => json is CONTENT
}
export const isRelationData =
	<
		CONTENT extends Json.Object | null = null,
		A extends string = `from`,
		B extends string = `to`,
	>({
		from: a = `from` as A,
		to: b = `to` as B,
		isContent,
	}: IsRelationDataOptions<CONTENT, A, B> = {}) =>
	(input: unknown): input is RelationData<CONTENT, A, B> => {
		return hasExactProperties<RelationData<CONTENT, A, B>>({
			contents: isContent
				? isRecord(isString, isContent)
				: hasExactProperties({}),
			relations: isRecord(isString, isArray(isString)),
			relationType: isRelationType,
			a: isLiteral(a),
			b: isLiteral(b),
		})(input)
	}
