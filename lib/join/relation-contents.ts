import type { Identified } from "id/identified"

import type { JsonObj } from "../json"
import type { RelationData } from "./core-relation-data"
import { getRelatedId, getRelatedIds } from "./get-relation"

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

export const getRelationEntries = <CONTENT extends JsonObj | null = null>(
  relationMap: RelationData<CONTENT>,
  idA: string
): [string, CONTENT][] =>
  getRelatedIds(relationMap, idA).map((idB) => [
    idB,
    getContent(relationMap, idA, idB) as CONTENT,
  ])

export const getRelationRecord = <CONTENT extends JsonObj | null = null>(
  relationMap: RelationData<CONTENT>,
  id: string
): Record<string, CONTENT> =>
  Object.fromEntries(getRelationEntries(relationMap, id))

export const getRelations = <CONTENT extends JsonObj | null = null>(
  relationMap: RelationData<CONTENT>,
  id: string
): (CONTENT & Identified)[] =>
  getRelationEntries(relationMap, id).map(([id, content]) => ({
    id,
    ...content,
  }))

export const getRelation = <CONTENT extends JsonObj | null = null>(
  relationMap: RelationData<CONTENT>,
  id: string
): (CONTENT & Identified) | undefined => {
  const relatedId = getRelatedId(relationMap, id)[0]
  if (relatedId) {
    const content = getContent(relationMap, id, relatedId)
    if (content) {
      return { id: relatedId, ...content }
    }
  }
}
