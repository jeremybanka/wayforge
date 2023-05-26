import type { RelationData } from "./core-relation-data"
import type { JsonObj } from "../json"

export const getRelatedIds = <
  CONTENT extends JsonObj | null,
  A extends string,
  B extends string
>(
  relationMap: RelationData<CONTENT, A, B>,
  id: string
): string[] => relationMap.relations[id] ?? []

export const getRelatedId = <
  CONTENT extends JsonObj | null,
  A extends string,
  B extends string
>(
  relationMap: RelationData<CONTENT, A, B>,
  id: string
): string | undefined => {
  const relations = getRelatedIds(relationMap, id)
  if (relations.length > 1) {
    console.warn(
      `entry with id ${id} was not expected to have multiple relations`
    )
  }
  return relations[0]
}
