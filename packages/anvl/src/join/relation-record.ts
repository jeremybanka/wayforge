import type { Json } from "../json"
import type { RelationData } from "./core-relation-data"
import { getRelatedIds } from "./get-related-ids"
import { getContent } from "./relation-contents"

export const getRelationEntries = <
	CONTENT extends Json.Object | null,
	A extends string,
	B extends string,
>(
	relationMap: RelationData<CONTENT, A, B>,
	idA: string,
): [string, CONTENT][] =>
	getRelatedIds(relationMap, idA).map((idB) => [
		idB,
		getContent(relationMap, idA, idB) as CONTENT,
	])

export const getRelationRecord = <
	CONTENT extends Json.Object | null,
	A extends string,
	B extends string,
>(
	relationMap: RelationData<CONTENT, A, B>,
	id: string,
): Record<string, CONTENT> =>
	Object.fromEntries(getRelationEntries(relationMap, id))
