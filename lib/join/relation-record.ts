import type { Identified } from "id/identified"

import type { JsonObj } from "../json"
import type { RelationData } from "./core-relation-data"
import { getRelatedId, getRelatedIds } from "./get-relation"
import { getContent } from "./relation-contents"

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
