import { pipe } from "fp-ts/lib/function"
import type { Identified } from "id/identified"

import { using } from "~/lib/fp-tools/array"
import { isEmptyObject } from "~/lib/fp-tools/object"

import type { JsonObj } from "../json"
import type { RelationData } from "./core-relation-data"
import { getRelatedId, getRelatedIds } from "./get-relation"
import { getRelationEntries } from "./relation-record"
import { removeRelation } from "./remove-relation"
import { setRelationWithContent } from "./set-relation"

export const makeContentId = (idA: string, idB: string): string =>
  [idA, idB].sort().join(`/`)

export const getContent = <CONTENT extends JsonObj | null = null>(
  relationMap: RelationData<CONTENT>,
  idA: string,
  idB: string
): CONTENT | undefined => relationMap.contents[makeContentId(idA, idB)]

export const setContent = <CONTENT extends JsonObj | null = null>(
  map: RelationData<CONTENT>,
  idA: string,
  idB: string,
  content: CONTENT
): RelationData<CONTENT> => ({
  ...map,
  contents: {
    ...map.contents,
    [makeContentId(idA, idB)]: content,
  },
})

export const getRelations = <CONTENT extends JsonObj | null = null>(
  relationMap: RelationData<CONTENT>,
  id: string
): (CONTENT & Identified)[] =>
  getRelationEntries(relationMap, id).map(([id, content]) => ({
    id,
    ...content,
  }))

export const setRelations = <CONTENT extends JsonObj | null = null>(
  current: RelationData<CONTENT>,
  idA: string,
  relations: (CONTENT & Identified)[]
): RelationData<CONTENT> =>
  pipe(
    current,
    (relationData) => {
      const relatedIds = getRelatedIds(current, idA)
      const removedIds = relatedIds.filter(
        (id) => !relations.some((r) => r.id === id)
      )
      let step = relationData
      for (const idB of removedIds) step = removeRelation(step, idA, idB)
      return step
    },
    (relationData) => {
      let step = relationData
      for (const { id: idB, ...rest } of relations) {
        const content = isEmptyObject(rest) ? undefined : rest
        // @ts-expect-error Omit<CONTENT & Identified, "id"> === CONTENT
        step = setRelationWithContent(step, idA, idB, content)
      }
      return step
    },
    (relationData) => {
      const newlyOrderedIds = relations.map((r) => r.id)
      return {
        ...relationData,
        relations: {
          ...relationData.relations,
          [idA]: newlyOrderedIds,
        },
      }
    }
  )

// export const getRelation = <CONTENT extends JsonObj | null = null>(
//   relationMap: RelationData<CONTENT>,
//   id: string
// ): (CONTENT & Identified) | undefined => {
//   const relatedId = getRelatedId(relationMap, id)[0]
//   if (relatedId) {
//     const content = getContent(relationMap, id, relatedId)
//     if (content) {
//       return { id: relatedId, ...content }
//     }
//   }
// }

// export const setRelation = <CONTENT extends JsonObj | null = null>(
//   current: RelationData<CONTENT>,
//   idA: string,
//   { id: idB, ...content }: CONTENT & Identified
// ): RelationData<CONTENT> =>
//   // @ts-expect-error Omit<CONTENT & Identified, "id"> === CONTENT
//   setRelationWithContent(current, idA, idB, content)
