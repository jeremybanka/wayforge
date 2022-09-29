import type { Json } from "../json"
import type { RelationData } from "./core-relation-data"
import { getRelations } from "./get-relation"

export const makeContentId = (idA: string, idB: string): string =>
  [idA, idB].sort().join(`/`)

export const getContent = <CONTENT extends Json | null = null>(
  relationMap: RelationData<CONTENT>,
  idA: string,
  idB: string
): CONTENT | undefined => relationMap.contents[makeContentId(idA, idB)]

export const setContent = <CONTENT extends Json | null = null>(
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

export const getRelationContentEntries = <CONTENT extends Json | null = null>(
  relationMap: RelationData<CONTENT>,
  idA: string
): [string, CONTENT][] =>
  getRelations(relationMap, idA).map((idB) => [
    idB,
    getContent(relationMap, idA, idB) as CONTENT,
  ])

export const getRelationContentRecord = <CONTENT extends Json | null = null>(
  relationMap: RelationData<CONTENT>,
  id: string
): Record<string, CONTENT> =>
  Object.fromEntries(getRelationContentEntries(relationMap, id))
