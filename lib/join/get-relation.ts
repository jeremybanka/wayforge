import type { Json, JsonObj } from "../json"
import type { RelationData } from "./core-relation-data"

export const getRelatedIds = <CONTENT extends JsonObj | null = null>(
  relationMap: RelationData<CONTENT>,
  id: string
): string[] => relationMap.relations[id] ?? []

export const getRelatedId = <CONTENT extends JsonObj | null = null>(
  relationMap: RelationData<CONTENT>,
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
