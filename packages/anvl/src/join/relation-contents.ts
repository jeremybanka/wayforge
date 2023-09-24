import { pipe } from "../function"
import type { Identified } from "../id/identified"
import type { Json } from "../json"
import type { NullSafeRest } from "../nullish"
import { isEmptyObject } from "../object/refinement"
import type { RelationData } from "./core-relation-data"
import { getRelatedIds } from "./get-related-ids"
import { getRelationEntries } from "./relation-record"
import { removeRelation } from "./remove-relation"
import { setRelationWithContent } from "./set-relation"

export const makeContentId = (idA: string, idB: string): string =>
	[idA, idB].sort().join(`/`)

export const getContent = <
	CONTENT extends Json.Object | null,
	A extends string,
	B extends string,
>(
	relationMap: RelationData<CONTENT, A, B>,
	idA: string,
	idB: string,
): CONTENT | undefined => relationMap.contents[makeContentId(idA, idB)]

export const setContent = <
	CONTENT extends Json.Object | null,
	A extends string,
	B extends string,
>(
	map: RelationData<CONTENT, A, B>,
	idA: string,
	idB: string,
	content: CONTENT,
): RelationData<CONTENT, A, B> => ({
	...map,
	contents: {
		...map.contents,
		[makeContentId(idA, idB)]: content,
	},
})

export const getRelations = <
	CONTENT extends Json.Object | null,
	A extends string,
	B extends string,
>(
	relationMap: RelationData<CONTENT, A, B>,
	id: string,
): (CONTENT extends null ? Identified : CONTENT & Identified)[] =>
	getRelationEntries(relationMap, id).map(
		([id, content]) =>
			({
				id,
				...content,
			}) as CONTENT extends null ? Identified : CONTENT & Identified,
	)

export const setRelations = <
	CONTENT extends Json.Object | null,
	A extends string,
	B extends string,
>(
	current: RelationData<CONTENT, A, B>,
	subject: { [from in A]: string } | { [to in B]: string },
	relations: (CONTENT extends null ? Identified : CONTENT & Identified)[],
): RelationData<CONTENT, A, B> => {
	const idA: string | undefined = (subject as { [from in A]: string })[current.a]
	const idB: string | undefined = (subject as { [to in B]: string })[current.b]
	return pipe(
		current,
		(relationData) => {
			const relatedIds = getRelatedIds(current, idA)
			const removedIds = relatedIds.filter(
				(id) => !relations.some((r) => r.id === id),
			)
			let step = relationData
			for (const id of removedIds) {
				const remove = {
					[current.a]: idA ?? id,
					[current.b]: idB ?? id,
				} as Record<A | B, string>
				step = removeRelation(step, remove)
			}
			return step
		},
		(relationData) => {
			let step = relationData
			for (const { id, ...rest } of relations) {
				const content = isEmptyObject(rest) ? undefined : rest
				step = setRelationWithContent(
					step,
					{ [current.a]: idA ?? id, [current.b]: idB ?? id } as Record<
						A | B,
						string
					>,
					// @ts-expect-error hacky
					content as NullSafeRest<CONTENT>,
				)
			}
			return step
		},
		(relationData) => {
			const newlyOrderedIds = relations.map((r) => r.id)
			return {
				...relationData,
				relations: {
					...relationData.relations,
					[idA ?? idB]: newlyOrderedIds,
				},
			}
		},
	)
}
